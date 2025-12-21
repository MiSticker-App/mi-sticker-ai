"""
Servicio de procesamiento de imágenes para crear stickers.
"""
import io
import numpy as np
from PIL import Image
import cv2
from rembg import remove


class StickerProcessor:
    """Procesador de imágenes para crear stickers con fondo removido y borde blanco."""
    
    def create_sticker(self, image_bytes: bytes) -> bytes:
        """
        Crea un sticker procesando la imagen: quita fondo, añade borde blanco y optimiza.
        
        Args:
            image_bytes: Bytes de la imagen original
            
        Returns:
            Bytes de la imagen procesada en formato WEBP (512x512px)
        """
        try:
            # 1. Background Removal usando rembg
            image_without_bg = remove(image_bytes)
            
            # Convertir a PIL Image para procesamiento
            pil_image = Image.open(io.BytesIO(image_without_bg)).convert("RGBA")
            
            # 2. White Border (Stroke) usando OpenCV
            sticker_with_border = self._add_white_border(pil_image)
            
            # 3. Resize/Format: Redimensionar a 512x512px y convertir a WEBP
            final_sticker = self._resize_and_convert(sticker_with_border)
            
            # Convertir a bytes
            output = io.BytesIO()
            final_sticker.save(output, format="WEBP", quality=90, method=6)
            output.seek(0)
            
            return output.getvalue()
            
        except Exception as e:
            raise Exception(f"Error procesando imagen: {str(e)}")
    
    def _add_white_border(self, image: Image.Image, border_size: int = 10) -> Image.Image:
        """
        Añade un borde blanco alrededor de la imagen usando dilatación morfológica.
        
        Args:
            image: Imagen PIL en formato RGBA
            border_size: Tamaño del borde en píxeles (dilatación)
            
        Returns:
            Imagen con borde blanco añadido
        """
        # Convertir PIL Image a numpy array
        img_array = np.array(image)
        
        # Extraer canal alfa como máscara
        alpha_channel = img_array[:, :, 3]
        
        # Crear kernel morfológico para dilatación (circular para mejor resultado)
        kernel_size = border_size * 2 + 1
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
        
        # Dilatar la máscara alfa (expandir hacia afuera)
        dilated_mask = cv2.dilate(alpha_channel, kernel, iterations=1)
        
        # Crear nueva imagen con fondo blanco del tamaño dilatado
        new_width = img_array.shape[1] + border_size * 2
        new_height = img_array.shape[0] + border_size * 2
        
        # Calcular offset para centrar la imagen original
        offset_x = border_size
        offset_y = border_size
        
        # Crear imagen base blanca
        white_background = np.ones((new_height, new_width, 4), dtype=np.uint8) * 255
        
        # Crear máscara expandida para el borde blanco
        expanded_mask = np.zeros((new_height, new_width), dtype=np.uint8)
        expanded_mask[offset_y:offset_y + dilated_mask.shape[0], 
                     offset_x:offset_x + dilated_mask.shape[1]] = dilated_mask
        
        # Aplicar máscara expandida al fondo blanco (solo donde hay dilatación)
        white_background[:, :, 3] = expanded_mask  # Canal alfa
        
        # Superponer la imagen original centrada sobre el borde blanco
        orig_alpha = img_array[:, :, 3]
        orig_rgb = img_array[:, :, :3]
        
        # Crear imagen original con offset
        orig_with_offset = np.zeros((new_height, new_width, 4), dtype=np.uint8)
        orig_with_offset[offset_y:offset_y + img_array.shape[0],
                        offset_x:offset_x + img_array.shape[1], :3] = orig_rgb
        orig_with_offset[offset_y:offset_y + img_array.shape[0],
                        offset_x:offset_x + img_array.shape[1], 3] = orig_alpha
        
        # Combinar: donde hay imagen original, usar esa; donde solo hay borde, usar blanco
        result = white_background.copy()
        
        # Donde hay imagen original (alpha > 0), usar la imagen original
        orig_mask = orig_with_offset[:, :, 3] > 0
        result[orig_mask] = orig_with_offset[orig_mask]
        
        # Donde solo hay borde (dilatado pero no original), mantener blanco
        border_mask = (expanded_mask > 0) & (orig_with_offset[:, :, 3] == 0)
        result[border_mask] = [255, 255, 255, expanded_mask[border_mask]]
        
        # Convertir de vuelta a PIL Image
        result_image = Image.fromarray(result, mode="RGBA")
        
        return result_image
    
    def _resize_and_convert(self, image: Image.Image, target_size: int = 512) -> Image.Image:
        """
        Redimensiona la imagen a tamaño cuadrado manteniendo aspect ratio.
        
        Args:
            image: Imagen PIL
            target_size: Tamaño objetivo (512x512)
            
        Returns:
            Imagen redimensionada con padding blanco si es necesario
        """
        # Calcular nuevo tamaño manteniendo aspect ratio
        width, height = image.size
        max_dim = max(width, height)
        
        if max_dim > target_size:
            # Reducir proporcionalmente
            scale = target_size / max_dim
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            width, height = new_width, new_height
        
        # Crear imagen cuadrada con fondo blanco
        square_image = Image.new("RGBA", (target_size, target_size), (255, 255, 255, 255))
        
        # Centrar la imagen en el cuadrado
        offset_x = (target_size - width) // 2
        offset_y = (target_size - height) // 2
        
        # Pegar la imagen centrada
        square_image.paste(image, (offset_x, offset_y), image if image.mode == "RGBA" else None)
        
        return square_image

