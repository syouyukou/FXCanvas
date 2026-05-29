export interface SampleAuthor {
	/** Display handle without @ */
	handle: string;
	/** Instagram username — links to instagram.com/{instagram} */
	instagram?: string;
	/** Fallback profile when no Instagram is listed */
	profileUrl?: string;
}

export interface SampleImage {
	id: string;
	url: string;
	thumbUrl: string;
	labelKey: string;
	authors: SampleAuthor[];
}

export const SAMPLE_IMAGES: SampleImage[] = [
	{
		id: 'syouyu-biomech',
		url: '/samples/syouyu-biomech.jpg',
		thumbUrl: '/samples/syouyu-biomech.jpg',
		labelKey: 'samples.biomech',
		authors: [
			{
				handle: 'syouyu_kou_graphic',
				instagram: 'syouyu_kou_graphic'
			}
		]
	},
	{
		id: 'kimx70-art',
		url: '/samples/kimx70-art.jpg',
		thumbUrl: '/samples/kimx70-art.jpg',
		labelKey: 'samples.illustration',
		authors: [
			{
				handle: 'dzhannatik',
				instagram: 'dzhannatik'
			},
			{
				handle: 'mitya_lyalin',
				instagram: 'mitya_lyalin'
			}
		]
	},
	{
		id: 'hero-portrait',
		url: '/previews/sources/hero-portrait.webp',
		thumbUrl: '/previews/sources/hero-portrait.webp',
		labelKey: 'samples.portrait',
		authors: [
			{
				handle: 'alipazani',
				profileUrl: 'https://unsplash.com/@alipazani'
			}
		]
	},
	{
		id: 'hero-neon',
		url: '/previews/sources/hero-neon.webp',
		thumbUrl: '/previews/sources/hero-neon.webp',
		labelKey: 'samples.neon',
		authors: [
			{
				handle: 'miladfakurian',
				profileUrl: 'https://unsplash.com/@miladfakurian'
			}
		]
	},
	{
		id: 'hero-night',
		url: '/previews/sources/hero-night.webp',
		thumbUrl: '/previews/sources/hero-night.webp',
		labelKey: 'samples.night',
		authors: [
			{
				handle: 'lucabravo',
				profileUrl: 'https://unsplash.com/@lucabravo'
			}
		]
	}
];

export function getSampleById(id: string): SampleImage | undefined {
	return SAMPLE_IMAGES.find((s) => s.id === id);
}

/** Match a loaded image URL back to a curated sample (for credit restoration). */
export function getSampleByUrl(url: string): SampleImage | undefined {
	const path = url.split('?')[0]?.split('#')[0] ?? url;
	return SAMPLE_IMAGES.find((s) => path.endsWith(s.url) || path === s.url);
}

export function getSampleCreditForUrl(url: string): SampleAuthor[] | null {
	return getSampleByUrl(url)?.authors ?? null;
}

export function getSampleByHeroId(heroId: string): SampleImage | undefined {
	return getSampleById(heroId);
}

export function authorProfileUrl(author: SampleAuthor): string {
	if (author.instagram) return `https://www.instagram.com/${author.instagram}/`;
	if (author.profileUrl) return author.profileUrl;
	return `https://www.instagram.com/${author.handle}/`;
}
