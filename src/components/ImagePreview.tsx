import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

interface SerializedFile {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    url?: string;
  }
  
  type FileOrSerialized = File | SerializedFile;

interface ImagePreviewProps {
  file: FileOrSerialized;
}

export const ImagePreview = ({ file }: ImagePreviewProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if ('url' in file && file.url) {
      setImageUrl(file.url);
    } else {
      setImageUrl('');
      setIsLoading(false);
    }
  }, [file]);

  if (!imageUrl) {
    return (
      <div className="max-w-sm mb-2 p-2 bg-muted rounded-lg">
        <span className="text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-sm mb-2 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
        )}
        <img
          src={imageUrl}
          alt={file instanceof File ? file.name : file.name}
          className="rounded-lg max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setIsZoomed(true)}
          onLoad={() => setIsLoading(false)}
        />
      </div>

      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl p-0">
          <img
            src={imageUrl}
            alt={file instanceof File ? file.name : file.name}
            className="w-full h-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};