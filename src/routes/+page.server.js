import { Client } from '@notionhq/client';
import { NOTION_TOKEN } from '$env/static/private';

export const load = async ({ params }) => {
 
    const getPlaces = async () => {
        const notion = new Client({
			auth: NOTION_TOKEN //'secret_7p9xpe3MmdxuUKJDoegKPwLGONGb9JA49jJVbbsEz8k' //import.meta.env.VITE_NOTION_TOKEN
		});

		const response = await notion.databases.query({
			database_id: 'b43ad05caae746ca9c91f54e7eb24bb3'
		});
		return response;
    };

    return {
        places: getPlaces()
    };
};