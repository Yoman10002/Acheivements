; Inno Setup script — compile with: iscc build\installer.iss
; Requires Inno Setup 6: https://jrsoftware.org/isinfo.php

#define AppName "Chat Server"
#define AppVersion "1.0.0"
#define AppPublisher "Chat App"
#define AppExeName "Start Chat Server.bat"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\ChatServer
DefaultGroupName={#AppName}
OutputDir=..\dist
OutputBaseFilename=ChatServer-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest

[Files]
Source: "..\*"; DestDir: "{app}"; Excludes: "node_modules\*,dist\*,data\*,.git\*"; Flags: ignoreversion recursesubdirs
Source: "..\node_modules\*"; DestDir: "{app}\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs; Check: DirExists(ExpandConstant('{src}\..\node_modules'))
Source: "package-portable-launcher.bat"; DestDir: "{app}"; DestName: "{#AppExeName}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{group}\Dashboard"; Filename: "http://localhost:3000/dashboard"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create desktop shortcut"; GroupDescription: "Additional icons:"

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Start Chat Server now"; Flags: postinstall nowait skipifsilent
