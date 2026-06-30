import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Star, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageFile {
  file?: File;
  preview: string;
  id?: number; 
}

interface ImageUploadProps {
  onFilesChange: (files: File[]) => void;
  existingImages?: { id: number; url: string }[];
  onDeleteExisting?: (id: number) => void;
  maxFiles?: number;
  maxFileSize?: number; 
  acceptedTypes?: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onFilesChange,
  existingImages = [],
  onDeleteExisting,
  maxFiles = 10,
  maxFileSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
}) => {
  const [newImages, setNewImages] = useState<ImageFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    
    onFilesChange(newImages.map(img => img.file!).filter(Boolean));
  }, [newImages, onFilesChange]);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de arquivo não suportado. Use: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxFileSize}MB`;
    }
    
    return null;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    setError(null);
    const addedImages: ImageFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        continue;
      }
      
      if (existingImages.length + newImages.length + addedImages.length >= maxFiles) {
        setError(`Máximo de ${maxFiles} imagens permitidas`);
        break;
      }
      
      const preview = URL.createObjectURL(file);
      addedImages.push({
        file,
        preview,
      });
    }
    
    if (addedImages.length > 0) {
      setNewImages(prev => [...prev, ...addedImages]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Clique para fazer upload ou arraste as imagens
        </p>
        <p className="text-xs text-muted-foreground">
          Máximo: {maxFiles} imagens, {maxFileSize}MB cada
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {}
      {(existingImages.length > 0 || newImages.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Imagens ({existingImages.length + newImages.length}/{maxFiles})</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {}
            {existingImages.map((img) => (
              <Card key={`existing-${img.id}`} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <img
                      src={img.url}
                      alt="Existing"
                      className="w-full h-full object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteExisting && onDeleteExisting(img.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <Badge variant="secondary" className="text-xs">Salva</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {}
            {newImages.map((image, index) => (
              <Card key={`new-${index}`} className="relative group border-primary/50">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <img
                      src={image.preview}
                      alt={`New ${index}`}
                      className="w-full h-full object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeNewImage(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <Badge variant="default" className="text-xs">Nova</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;