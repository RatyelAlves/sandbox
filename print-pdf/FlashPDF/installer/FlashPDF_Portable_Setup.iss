; FlashPDF Portable - Instalador (Inno Setup 6)
; Nao instala SumatraPDF: o executavel ja inclui o leitor embutido.
; 1) powershell -ExecutionPolicy Bypass -File build.ps1 -Portable
; 2) Compile este arquivo (Ctrl+F9)

#define MyAppName "FlashPDF Portable"
#define MyAppVersion "1.2"
#define MyAppPublisher "3o Tabelionato de Protesto de Titulos de Belo Horizonte"
#define MyAppExeName "FlashPDF_Portable.exe"

#ifnexist "FlashPDF_Portable.exe"
  #error "Falta FlashPDF_Portable.exe nesta pasta. Execute build.ps1 -Portable ou build-portable.ps1."
#endif

[Setup]
AppId={{A7B2C4D8-E1F3-4A9B-9C2D-6E8F0A1B3C5D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputDir=Output
OutputBaseFilename=FlashPDF_Portable_Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
SetupIconFile=..\src\flashpdf.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
#ifexist "compiler:Languages\BrazilianPortuguese.isl"
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
#endif

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na Area de Trabalho"; GroupDescription: "Atalhos:"; Flags: unchecked

[Files]
Source: "{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Abrir {#MyAppName}"; Flags: nowait postinstall skipifsilent
