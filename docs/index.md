---
layout: home

hero:
  text: The Modern Toolchain for Knockout.js
  tagline: Enhancing developer experience with Knockout and delivering essential modern tools.
  image:
    src: /logo.png
    alt: Knuckles Shield
  actions:
    - theme: brand
      text: Introduction
      link: /guide/intro
    - theme: alt
      text: View on GitHub
      link: https://github.com/tscpp/knuckles
---

<style>
:root {
  /* from rollupjs.org */
	--vp-home-hero-image-background-image: linear-gradient(
		-45deg,
		hsl(0 100% 60% / 80%),
		hsl(15 100% 60% / 80%) 40%,
		hsl(23 96% 62% / 80%) 45%,
		hsl(0 100% 60% / 80%) 60%,
		hsl(358 58% 47% / 80%)
	);
	--vp-home-hero-image-filter: blur(40px) opacity(0.5);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px) opacity(0.5);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px) opacity(0.5);
  }
}

.image-src {
  scale: 0.8;
  transform-origin: top left;
}

.index-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 32px;
}

.index-content h2:first-child {
  border: none;
}

</style>

<hr />

<div class="index-content">

## Analyzer

<!-- @include: @/parts/packages/analyzer/description.md -->

<div align="center">

[Read more ›](/guide/analyzer/intro)

</div>

<!-- @include: @/parts/features/analyzer/vp-example.md -->

## Server-side Render {#ssr}

<!-- @include: @/parts/packages/ssr/description.md -->

<div align="center">

[Read more ›](/guide/ssr/intro)

</div>

<!-- @include: @/parts/features/ssr/vp-example.md -->

## Language Support

<!-- @include: @/parts/packages/language-support/description.md -->

<div align="center">

[Read more ›](/guide/language-support/intro)

</div>

</div>

<!-- @include: @/parts/reference.md -->
