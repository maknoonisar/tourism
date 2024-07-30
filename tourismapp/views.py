import requests
import os
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse




# Create your views here.
def kpk_home(request):
    return render(request, 'kpk-home.html')

def index(request):
    return render(request, 'index.html')

def punjab_home(request):
    return render(request, 'punjab-home.html')

def sindh_home(request):
    return render(request, 'sindh-home.html')

def balochistan_home(request):
    return render(request, 'balochistan-home.html')

def gilgit_home(request):
    return render(request, 'gilgit-home.html')

def capital_home(request):
    return render(request, 'capital-home.html')


