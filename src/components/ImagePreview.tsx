import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"

export const ImagePreview = ({ file }: { file: File }) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isZoomed, setIsZoomed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <>
            <div className="max-w-sm mb-2 relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
                )}
                <img
                    src={imageUrl}
                    alt={file.name}
                    className="rounded-lg max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsZoomed(true)}
                    onLoad={() => setIsLoading(false)}
                />
            </div>

            <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
                <DialogContent className="max-w-4xl p-0">
                    <img
                        src={imageUrl}
                        alt={file.name}
                        className="w-full h-full object-contain"
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};