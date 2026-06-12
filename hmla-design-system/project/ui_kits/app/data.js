// hmla app — demo content (presets, channels). Plain JS, attached to window.
window.HMLA_DATA = {
  presets: [
    { id: "deep",  name: "deep field",    len: "∞",      seed: "0x4F2A", tags: ["drone", "warm"],   mode: "bars" },
    { id: "rain",  name: "rain · soft",    len: "∞",      seed: "0x9C11", tags: ["noise", "grey"],   mode: "wave" },
    { id: "tape",  name: "tape hiss",      len: "12:00",  seed: "0x1B7E", tags: ["analog"],          mode: "wave" },
    { id: "shore", name: "shoreline",      len: "∞",      seed: "0x3D04", tags: ["water", "wide"],   mode: "bars" },
    { id: "vent",  name: "vent hum",       len: "∞",      seed: "0x77A9", tags: ["low", "steady"],   mode: "bars" },
    { id: "dust",  name: "dust storm",     len: "08:30",  seed: "0xE2C0", tags: ["pink", "dense"],   mode: "bars" },
    { id: "glass", name: "glass tones",    len: "∞",      seed: "0x5511", tags: ["bell", "sparse"],  mode: "wave" },
    { id: "node",  name: "null node",      len: "∞",      seed: "0x0000", tags: ["silence+"],        mode: "wave" },
  ],
  channels: [
    { id: "a", name: "field",  level: 74 },
    { id: "b", name: "grain",  level: 52 },
    { id: "c", name: "sub",    level: 38 },
    { id: "d", name: "air",    level: 61 },
    { id: "e", name: "send",   level: 28 },
  ],
};
