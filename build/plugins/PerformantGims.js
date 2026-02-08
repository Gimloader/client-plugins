/**
 * @name PerformantGims
 * @description Replaces configurable gims with images of them. Looks like crap, runs really fast.
 * @author TheLazySquid
 * @version 0.5.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/PerformantGims.js
 * @webpage https://gimloader.github.io/plugins/performantgims
 * @reloadRequired ingame
 * @hasSettings true
 */

// plugins/PerformantGims/src/index.ts
var settings = api.settings.create([
  {
    type: "dropdown",
    title: "Apply To",
    description: "Which characters should be converted into still images? You will need to reload to see changes if in game.",
    id: "applyTo",
    options: [
      { value: "everything", label: "Everything" },
      { value: "sentries", label: "Sentries" },
      { value: "others", label: "Others" }
    ],
    default: "others"
  }
]);
settings.listen("applyTo", () => {
  if (api.net.type !== "Colyseus") return;
  api.requestReload();
});
function shouldApply(character) {
  if (settings.applyTo === "everything") return true;
  else if (settings.applyTo === "sentries") return character.type === "sentry";
  return character.id !== api.stores.network.authId;
}
var wrapSkin = api.rewriter.createShared("WrapSkin", (Skin) => {
  class NewSkin {
    character;
    scene;
    skinId = "character_default_cyan";
    latestSkinId = "character_default_cyan";
    constructor(props) {
      this.character = props.character;
      this.scene = props.scene;
      if (!props.character || !shouldApply(props.character)) {
        return new Skin(props);
      }
    }
    updateSkin(A) {
      A.id = A.id.replace("character_", "");
      const load = this.scene.load.image(`gim-${A.id}`, `https://www.gimkit.com/assets/map/characters/spine/preview/${A.id}.png`);
      load.on("complete", () => {
        this.setupSkin({
          id: A.id
        });
      });
      load.start();
    }
    setupSkin(position) {
      const x = position.x ?? this.character.spine.x;
      const y = position.y ?? this.character.spine.y;
      if (this.character.spine) this.character.spine.destroy(true);
      this.character.scale.baseScale = 0.7;
      this.character.spine = this.scene.add.sprite(x, y, `gim-${position.id}`);
      this.character.spine.setOrigin(0.5, 0.75);
      this.character.spine.skeleton = { color: {}, physicsTranslate: () => {
      } };
      const scale = this.character.scale;
      this.character.spine.setScale(scale.scaleX, scale.scaleY);
      this.character.characterTrail.followCharacter();
    }
    applyEditStyles() {
    }
  }
  return NewSkin;
});
api.rewriter.addParseHook("App", (code) => {
  const index = code.indexOf("JSON.stringify(this.editStyles");
  if (index === -1) return code;
  const classStart = code.lastIndexOf("class ", index);
  const nameEnd = code.indexOf("{", classStart);
  const name = code.slice(classStart + 6, nameEnd);
  const classEnd = code.indexOf("}}", code.indexOf("this.character=", index)) + 2;
  const classCode = code.slice(classStart, classEnd);
  code = code.slice(0, classStart) + `const ${name}=(${wrapSkin} ?? (v => v))(${classCode});` + code.slice(classEnd);
  return code;
});
var wrapAnimations = api.rewriter.createShared("WrapAnimations", (Animation) => {
  class NewAnimation {
    constructor(props) {
      if (!shouldApply(props.character)) {
        return new Animation(props);
      }
    }
    destroy() {
    }
    update() {
    }
    onSkinChanged() {
    }
  }
  return NewAnimation;
});
api.rewriter.addParseHook("FixSpinePlugin", (code) => {
  const index = code.indexOf("onSkinChanged=");
  if (index === -1) return code;
  const classStart = code.lastIndexOf("class ", index);
  const nameEnd = code.indexOf("{", classStart);
  const name = code.slice(classStart + 6, nameEnd);
  const classEnd = code.indexOf("}}", code.indexOf("this.character=", index)) + 2;
  const classCode = code.slice(classStart, classEnd);
  code = code.slice(0, classStart) + `const ${name}=(${wrapAnimations}??(v=>v))(${classCode});` + code.slice(classEnd);
  return code;
});
