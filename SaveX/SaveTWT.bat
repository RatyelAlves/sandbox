@echo off
cd /d "%~dp0"
py app.py
if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar. Instale as dependencias com:
  echo py -m pip install -r requirements.txt
  pause
)
