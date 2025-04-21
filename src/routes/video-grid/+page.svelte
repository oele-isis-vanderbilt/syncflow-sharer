<script lang="ts">
	import { Label, Range } from "flowbite-svelte";
    const videoUrl = "https://videocdn.cdnpk.net/joy/content/video/free/2014-12/large_preview/Raindrops_Videvo.mp4?token=exp=1745265721~acl=/*~hmac=05179592cb03f038b3029188980786540b874d4f9be32ffa5ef0d2280b92e8aa";

    let videoCount = $state(10);

    const allVideos: string[] = $derived(new Array(videoCount).fill(videoUrl));

</script>

<div class="max-w-8xl mx-auto flex flex-col px-2 py-2">
    <div class="flex flex-row justify-between py-5">
        <Label>Number of Videos</Label>
        <Label>{videoCount}</Label>
    </div>
    <Range id="large-range" size="lg" class="mb-10"  bind:value={videoCount} min="0" max="50" />
    <div class="p-2 mb-20">

    {#each allVideos as video}
        <video src="{video}" class="w-full mb-2" autoplay loop muted playsinline></video>
    {/each}
    </div>

</div>
