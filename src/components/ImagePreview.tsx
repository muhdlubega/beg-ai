import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/lib/supaBaseClient";

interface SerializedFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  url?: string;
  path?: string;
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
    const getImageUrl = async () => {
      try {
        if (file instanceof File) {
          const url = URL.createObjectURL(file);
          setImageUrl(url);
          return () => URL.revokeObjectURL(url);
        } else {
          if (file.url) {
            setImageUrl(file.url);
          } else if (file.path) {
            const { data, error } = await supabase.storage
              .from('chat-images')
              .createSignedUrl(file.path, 60 * 60 * 24);

            if (error) {
              console.error('Error getting signed URL:', error);
              throw error;
            }

            if (data) {
              setImageUrl(data.signedUrl);
            }
          }
        }
      } catch (error) {
        console.error('Error loading image:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getImageUrl();
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
          onError={(e) => {
            console.error('Error loading image:', e);
            setIsLoading(false);
          }}
        />
      </div>

      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl p-0 [&>button]:hidden">
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