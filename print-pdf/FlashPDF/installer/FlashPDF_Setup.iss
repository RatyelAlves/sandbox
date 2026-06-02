; FlashPDF - Instalador (Inno Setup 6)
; 1) powershell -ExecutionPolicy Bypass -File build.ps1   (na pasta FlashPDF)
; 2) Compile este arquivo (Ctrl+F9) - os .exe devem estar NA MESMA pasta deste .iss

#define MyAppName "FlashPDF"
#define MyAppVersion "1.2"
#define MyAppPublisher "3o Tabelionato de Protesto de Titulos de Belo Horizonte"
#define MyAppExeName "FlashPDF.exe"

#ifnexist "FlashPDF.exe"
  #error "Falta FlashPDF.exe nesta pasta. Execute build.ps1 na pasta FlashPDF (pai desta pasta installer)."
#endif

#ifexist "SumatraPDF-3.5.2-64-install.exe"
  #define IncludeSumatra
#endif

[Setup]
AppId={{8F3C2E19-B4D4-4F2A-8E1C-D4F5A6B7C8D9}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputDir=Output
OutputBaseFilename=FlashPDF_Setup
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
#ifdef IncludeSumatra
Source: "SumatraPDF-3.5.2-64-install.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall
#endif

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
#ifdef IncludeSumatra
Filename: "{tmp}\SumatraPDF-3.5.2-64-install.exe"; Parameters: "/S"; StatusMsg: "Instalando SumatraPDF..."; Flags: runhidden
#endif
Filename: "{app}\{#MyAppExeName}"; Description: "Abrir {#MyAppName}"; Flags: nowait postinstall skipifsilent
