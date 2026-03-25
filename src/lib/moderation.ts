import {Filter} from 'bad-words';

const filter = new Filter();

export function moderateReviewText(text: string): { passed: boolean; reason?: string } {
    if (filter.isProfane(text)) {
        return { passed: false, reason: 'Your review contains inappropriate language. Please keep reviews respectful.' };
    }

    if (text.length > 10 && text === text.toUpperCase()) {
        return { passed: false, reason: 'Please avoid writing your review in all caps.' };
    }

    if (/([!?.])\1{4,}/.test(text)) {
        return { passed: false, reason: 'Your review contains excessive punctuation. Please keep it constructive.' };
    }

    return { passed: true };
}
