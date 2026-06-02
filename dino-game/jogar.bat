@echo off
set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"

if not exist "%PYTHON%" (
    echo Python nao encontrado.
    echo Instale em: https://www.python.org/downloads/
    pause
    exit /b 1
)

cd /d "%~dp0"
"%PYTHON%" dino.py
