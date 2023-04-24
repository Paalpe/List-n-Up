import { Client } from '@notionhq/client';
import { NOTION_TOKEN, NOTION_MAIL_DB_ID } from '$env/static/private';

export const load = async ({ params }) => {
 
    const getPlaces = async () => {
        const notion = new Client({
			auth: NOTION_TOKEN //'secret_7p9xpe3MmdxuUKJDoegKPwLGONGb9JA49jJVbbsEz8k' //import.meta.env.VITE_NOTION_TOKEN
		});

		const response = await notion.databases.query({
			database_id: NOTION_MAIL_DB_ID
		});
		return response;
    };

    return {
        places: getPlaces()
    };
};