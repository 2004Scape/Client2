export function setupManifest(): void {
    const location: Location = window.location;
    const manifest: HTMLLinkElement = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = `${location.href.substring(0, location.href.indexOf(location.search))}/manifest.json`;
    document.head.appendChild(manifest);
}
