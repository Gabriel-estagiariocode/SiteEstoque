!macro customInstall
  CreateShortCut "$desktop\VeloStock.lnk" "$INSTDIR\VeloStock.exe" "" "$INSTDIR\resources\app-icon.ico" 0
  CreateDirectory "$SMPROGRAMS\VeloStock"
  CreateShortCut "$SMPROGRAMS\VeloStock\VeloStock.lnk" "$INSTDIR\VeloStock.exe" "" "$INSTDIR\resources\app-icon.ico" 0
!macroend

!macro customUnInstall
  Delete "$desktop\VeloStock.lnk"
  Delete "$SMPROGRAMS\VeloStock\VeloStock.lnk"
  RMDir "$SMPROGRAMS\VeloStock"
!macroend
