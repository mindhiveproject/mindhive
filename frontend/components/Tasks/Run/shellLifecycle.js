function createShellLifecycle(runtimeType, assetId, onLifecycle) {
  let mounted = false;
  return {
    mount() {
      if (mounted) return false;
      mounted = true;
      onLifecycle?.('mounted', { runtimeType, assetId });
      return true;
    },
    fail(error) {
      if (!mounted) throw new Error('Runtime shell is not mounted');
      onLifecycle?.('failure', { runtimeType, error });
    },
    cleanup() {
      if (!mounted) return false;
      mounted = false;
      onLifecycle?.('cleanup', { runtimeType });
      return true;
    },
    isMounted() {
      return mounted;
    },
  };
}

module.exports = { createShellLifecycle };
