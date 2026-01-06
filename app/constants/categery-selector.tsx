
export async function getCategeryData() {
  const isElectron = (
    typeof window !== 'undefined' && (
      window.process?.type === 'renderer' ||
      window.electron !== undefined ||
      navigator.userAgent.toLowerCase().includes('electron')
    )
  );
  if(isElectron){
    const { CATEGERY_DATA } = await import('./categery');
    return CATEGERY_DATA
  }else{
    return [];
  }
}