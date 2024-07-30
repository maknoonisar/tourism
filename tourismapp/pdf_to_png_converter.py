from django.http import JsonResponse, HttpResponseBadRequest
from pdf2image import convert_from_bytes
import os

def convert_pdf_to_png(request):
    if request.method == 'POST' and request.FILES.get('pdf_file'):
        pdf_file = request.FILES['pdf_file']
        # Create output folder if it doesn't exist
        output_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'advisory')
        os.makedirs(output_folder, exist_ok=True)
        try:
            # Convert PDF to PNG images
            images = convert_from_bytes(pdf_file.read())
            if images:
                # Save PNG images to output folder
                for i, image in enumerate(images):
                    image_path = os.path.join(output_folder, f'{pdf_file.name.replace(".pdf", "")}_{i+1}.png')
                    image.save(image_path, 'PNG')
                return JsonResponse({'message': 'PDF converted to PNG successfully'})
            else:
                return HttpResponseBadRequest('Failed to convert PDF to PNG')
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return HttpResponseBadRequest('No PDF file provided in the request')
