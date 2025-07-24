import useStore from "../store/use-store";
import { useEffect, useRef, useState } from "react";
import { Droppable } from "@/components/ui/droppable";
import { PlusIcon } from "lucide-react";
import { DroppableArea } from "./droppable";
import { createUploadsDetails } from "@/utils/upload";
import { dispatch } from "@designcombo/events";
import { ADD_VIDEO, ADD_IMAGE, ADD_AUDIO } from "@designcombo/state";
import { generateId } from "@designcombo/timeline";

const SceneEmpty = () => {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [desiredSize, setDesiredSize] = useState({ width: 0, height: 0 });
  const { size } = useStore();

  useEffect(() => {
    const container = containerRef.current!;
    const PADDING = 96;
    const containerHeight = container.clientHeight - PADDING;
    const containerWidth = container.clientWidth - PADDING;
    const { width, height } = size;

    const desiredZoom = Math.min(
      containerWidth / width,
      containerHeight / height,
    );
    setDesiredSize({
      width: width * desiredZoom,
      height: height * desiredZoom,
    });
    setIsLoading(false);
  }, [size]);

  const onSelectFiles = async (files: File[]) => {
    console.log({ files });
    
    for (const file of files) {
      try {
        // Get file type
        const fileType = file.type.split('/')[0]; // 'image', 'video', or 'audio'
        
        // Create upload details and upload the file
        const uploadDetails = await createUploadsDetails(file.name);
        
        // Upload the file to the presigned URL
        const uploadResponse = await fetch(uploadDetails.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }
        
        // Add the uploaded file to the editor
        const payload = {
          id: generateId(),
          details: {
            src: uploadDetails.url,
          },
          metadata: {
            previewUrl: uploadDetails.url,
          },
        };
        
        // Dispatch the appropriate action based on file type
        switch (fileType) {
          case 'video':
            dispatch(ADD_VIDEO, { payload });
            break;
          case 'image':
            dispatch(ADD_IMAGE, { payload });
            break;
          case 'audio':
            dispatch(ADD_AUDIO, { payload });
            break;
          default:
            console.warn('Unsupported file type:', fileType);
        }
        
      } catch (error) {
        console.error('Error uploading file:', error);
        // You might want to show a toast notification here
      }
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    console.log('Upload click triggered');
    e.stopPropagation();
    
    // Create a file input element and trigger it
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,image/*,audio/*';
    input.multiple = true;
    input.style.display = 'none';
    
    input.onchange = (e) => {
      console.log('File input changed');
      const files = Array.from((e.target as HTMLInputElement).files || []);
      console.log('Selected files:', files);
      if (files.length > 0) {
        onSelectFiles(files);
      }
      // Clean up
      document.body.removeChild(input);
    };
    
    // Add to DOM temporarily and trigger click
    document.body.appendChild(input);
    input.click();
  };

  return (
    <div ref={containerRef} className="absolute z-50 flex h-full w-full flex-1">
      {!isLoading ? (
        <Droppable
          maxFileCount={4}
          maxSize={4 * 1024 * 1024}
          disabled={false}
          onValueChange={onSelectFiles}
          accept={{
            "video/*": [],
            "image/*": [],
            "audio/*": [],
          }}
          noClick={false}
          className="h-full w-full flex-1 bg-background"
        >
          <DroppableArea
            onDragStateChange={setIsDraggingOver}
            className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform items-center justify-center border border-dashed text-center transition-colors duration-200 ease-in-out cursor-pointer ${
              isDraggingOver ? "border-white bg-white/10" : "border-white/15"
            }`}
            style={{
              width: desiredSize.width,
              height: desiredSize.height,
            }}
            onClick={handleUploadClick}
          >
            <div className="flex flex-col items-center justify-center gap-4 pb-12">
              <div className="hover:bg-primary-dark cursor-pointer rounded-md border bg-primary p-2 text-secondary transition-colors duration-200">
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-px">
                <p className="text-sm text-muted-foreground">Click to upload</p>
                <p className="text-xs text-muted-foreground/70">
                  Or drag and drop files here
                </p>
              </div>
            </div>
          </DroppableArea>
        </Droppable>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-background-subtle text-sm text-muted-foreground">
          Loading...
        </div>
      )}
    </div>
  );
};

export default SceneEmpty;
