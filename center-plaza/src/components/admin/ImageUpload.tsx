import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Star, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageFile {
  id?: number;
  file?: File;
  preview: string;
  isFeatured?: boolean;
  displayOrder?: number;
}

interface ImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxFileSize?: number; // em MB
  acceptedTypes?: string[];
  showFeatured?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  maxFileSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  showFeatured = true
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const newImages: ImageFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        continue;
      }
      
      if (images.length + newImages.length >= maxImages) {
        setError(`Máximo de ${maxImages} imagens permitidas`);
        break;
      }
      
      const preview = URL.createObjectURL(file);
      newImages.push({
        file,
        preview,
        displayOrder: images.length + newImages.length + 1
      });
    }
    
    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      
      // Se não há imagem de destaque e showFeatured está ativo, definir a primeira como destaque
      if (showFeatured && !updatedImages.some(img => img.isFeatured) && updatedImages.length > 0) {
        updatedImages[0].isFeatured = true;
      }
      
      onImagesChange(updatedImages);
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

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    // Reordenar display_order
    updatedImages.forEach((img, i) => {
      img.displayOrder = i + 1;
    });
    onImagesChange(updatedImages);
  };

  const setFeaturedImage = (index: number) => {
    if (!showFeatured) return;
    
    const updatedImages = images.map((img, i) => ({
      ...img,
      isFeatured: i === index,
      displayOrder: i === index ? 1 : (img.displayOrder && img.displayOrder > 1 ? img.displayOrder : i + 1)
    }));
    
    // Reordenar para que a imagem de destaque fique primeiro
    updatedImages.sort((a, b) => {
      if (a.isFeatured) return -1;
      if (b.isFeatured) return 1;
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
    
    // Atualizar display_order após reordenação
    updatedImages.forEach((img, i) => {
      img.displayOrder = i + 1;
    });
    
    onImagesChange(updatedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    // Atualizar display_order
    updatedImages.forEach((img, i) => {
      img.displayOrder = i + 1;
    });
    
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
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
          Máximo: {maxImages} imagens, {maxFileSize}MB cada
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

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Imagens ({images.length}/{maxImages})</h4>
            {showFeatured && (
              <p className="text-xs text-muted-foreground">
                Clique na estrela para definir imagem de destaque
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <Card key={index} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <img
                      src={image.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                    
                    {/* Overlay com controles */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                      {showFeatured && (
                        <Button
                          size="sm"
                          variant={image.isFeatured ? "default" : "secondary"}
                          onClick={() => setFeaturedImage(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Star className={`h-4 w-4 ${image.isFeatured ? 'fill-current' : ''}`} />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {image.isFeatured && showFeatured && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Destaque
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {index + 1}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Controles de reordenação */}
                  <div className="flex justify-between mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="h-6 px-2 text-xs"
                    >
                      ←
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage(index, Math.min(images.length - 1, index + 1))}
                      disabled={index === images.length - 1}
                      className="h-6 px-2 text-xs"
                    >
                      →
                    </Button>
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