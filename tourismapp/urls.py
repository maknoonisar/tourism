from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views
# from .views import get_advisory_files, convert_pdf_to_png
# from .views import get_advisory_files


urlpatterns = [
    path('', views.index, name='index'),  # Map root URL to index function
    path('capital-home/', views.capital_home, name='capital-home'),
    path('kpk-home/', views.kpk_home, name='kpk-home'),  
    path('punjab-home/', views.punjab_home, name='punjab-home'),
    path('sindh-home/', views.sindh_home, name='sindh-home'),
    path('balochistan-home/', views.balochistan_home, name='balochistan-home'),
    path('gilgit-home/', views.gilgit_home, name='gilgit-home'),
    # path('api/advisory-files/', get_advisory_files, name='advisory_files_api'),
    # path('convert-pdf-to-png/', convert_pdf_to_png, name='convert_pdf_to_png'),
]
# Add static URL patterns to serve static files during development
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)