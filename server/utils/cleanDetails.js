const cleanScanDetails = (details) => {
    if (!details) return null;
    
    // Remove URLs containing localhost or domain information
    return details.replace(/\s+at\s+(?:https?:\/\/)?(?:localhost|[\w.-]+)(?::\d+)?(?:\/[\w/-]*)?/gi, '');
  };