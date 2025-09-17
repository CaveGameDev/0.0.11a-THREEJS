async function validateImports() {
  const e = [];
  try {
    const s = await import("./LibHandler.js");
    console.log("✅ LibHandler.js loaded successfully"),
      console.log("   - THREE object available:", !!s.THREE),
      console.log("   - Individual exports available:", !!s.DataTextureLoader),
      e.push({ module: "LibHandler.js", status: "success" });
  } catch (s) {
    console.error("❌ LibHandler.js failed:", s.message), e.push({ module: "LibHandler.js", status: "failed", error: s.message });
  }
  try {
    const s = await import("./RGBELoader.js");
    console.log("✅ RGBELoader.js loaded successfully"), console.log("   - RGBELoader class available:", !!s.RGBELoader), e.push({ module: "RGBELoader.js", status: "success" });
  } catch (s) {
    console.error("❌ RGBELoader.js failed:", s.message), e.push({ module: "RGBELoader.js", status: "failed", error: s.message });
  }
  try {
    const s = await import("./GLTFLoader.js");
    console.log("✅ GLTFLoader.js loaded successfully"), console.log("   - GLTFLoader class available:", !!s.GLTFLoader), e.push({ module: "GLTFLoader.js", status: "success" });
  } catch (s) {
    console.error("❌ GLTFLoader.js failed:", s.message), e.push({ module: "GLTFLoader.js", status: "failed", error: s.message });
  }
  try {
    const s = await import("./lib/utils/BufferGeometryUtils.js");
    console.log("✅ BufferGeometryUtils.js loaded successfully"), console.log("   - toTrianglesDrawMode available:", !!s.toTrianglesDrawMode), e.push({ module: "BufferGeometryUtils.js", status: "success" });
  } catch (s) {
    console.error("❌ BufferGeometryUtils.js failed:", s.message), e.push({ module: "BufferGeometryUtils.js", status: "failed", error: s.message });
  }
  const s = ["./level/World.js", "./Player.js", "./render/Tile.js", "./render/font.js", "./character/Zombie.js", "./render/particle/ParticleEngine.js", "./PlaceHandler.js", "./Entity.js", "./Sound.js", "./config.js"];
  for (const o of s)
    try {
      await import(o);
      const s = o.split("/").pop();
      console.log(`✅ ${s} loaded successfully`), e.push({ module: s, status: "success" });
    } catch (s) {
      const l = o.split("/").pop();
      console.error(`❌ ${l} failed:`, s.message), e.push({ module: l, status: "failed", error: s.message });
    }
  try {
    await import("./RubyDung.js"), console.log("✅ RubyDung.js loaded successfully"), e.push({ module: "RubyDung.js", status: "success" });
  } catch (s) {
    console.error("❌ RubyDung.js failed:", s.message), e.push({ module: "RubyDung.js", status: "failed", error: s.message });
  }
  const o = e.filter((e) => "success" === e.status).length,
    l = e.filter((e) => "failed" === e.status).length;
  return (
    console.log("\n📊 Validation Summary:"),
    console.log(`✅ Successful: ${o}`),
    console.log(`❌ Failed: ${l}`),
    0 === l
      ? (console.log("🎉 All Three.js libraries and game modules are properly configured!"), console.log("🚀 Your game is ready to run with local Three.js libraries."))
      : console.log("⚠️  Some modules failed to load. Check the errors above."),
    e
  );
}
console.log("🔍 Validating complete import structure..."), validateImports().catch(console.error);
