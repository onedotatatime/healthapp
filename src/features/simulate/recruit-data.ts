/** The only importer of the 50,000-record file, so Vite makes it one chunk that RecruitSearch loads with `import()` after first paint (MIN-4706). */
import data from '../../../data/synthetic/recruit-50000.json';

export default data as unknown;
