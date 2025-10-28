const createVariableSaver = (key, defaultValue = null) => ({
  set: (data) => {
    localStorage.setItem(key, JSON.stringify(data));
  },
  get: (_defaultValue) => {
    return (
      JSON.parse(localStorage.getItem(key) || "null") ??
      _defaultValue ??
      defaultValue
    );
  },
});

export const langSaver = createVariableSaver("fb-aio-lang");
