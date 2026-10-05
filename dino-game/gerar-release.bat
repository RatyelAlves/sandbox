@echo off
setlocal

cd /d "%~dp0"
set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"

if not exist "%PYTHON%" (
    echo Python nao encontrado.
    exit /b 1
)

echo Gerando executavel...
"%PYTHON%" -m pip install pyinstaller --quiet
"%PYTHON%" -m PyInstaller --clean --noconfirm dino.spec
if errorlevel 1 exit /b 1

if not exist "release" mkdir "release"
copy /Y "dist\dino.exe" "release\dino.exe" >nul

echo.
echo Release atualizada em: release\
echo   - dino.exe
echo   - LEIA-ME.txt
