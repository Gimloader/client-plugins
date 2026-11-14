<script lang="ts">
    const Button = api.Components.Button;

    let { onclick }: { onclick: () => void } = $props();
</script>

<Button {onclick}>
    Open Customization Menu
</Button>
