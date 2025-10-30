/**
 * @name ShowHitboxes
 * @description Enables debug mode which shows hitboxes
 * @author TheLazySquid
 * @version 0.3.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/ShowHitboxes.js
 * @webpage https://gimloader.github.io/plugins/showhitboxes
 */

const message = "ShowHitboxes no longer works due to major changes by Gimkit. Feel free to uninstall it.";

api.net.onLoad(() => {
    api.notification.error({ message });
});