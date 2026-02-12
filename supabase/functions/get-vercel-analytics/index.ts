import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");
const VERCEL_PROJECT_ID = Deno.env.get("VERCEL_PROJECT_ID");
const VERCEL_TEAM_ID = Deno.env.get("VERCEL_TEAM_ID");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
            return new Response(
                JSON.stringify({
                    error: "Vercel configuration missing",
                    details: "VERCEL_TOKEN or VERCEL_PROJECT_ID not set in environment variables."
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        const teamParam = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : "";

        // 1. Fetch Project Details to verify access
        const projectRes = await fetch(
            `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}?${teamParam}`,
            {
                headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
            }
        );

        if (!projectRes.ok) {
            const err = await projectRes.json();
            return new Response(JSON.stringify({ error: "Vercel API Error", details: err }), {
                status: projectRes.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const projectData = await projectRes.json();

        // 2. Fetch Web Analytics Stats
        // We'll fetch for the last 7 days
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const statsUrl = `https://api.vercel.com/v1/analytics/stats/query?projectId=${VERCEL_PROJECT_ID}${teamParam}&from=${sevenDaysAgo.toISOString()}&to=${now.toISOString()}&metrics=visitors,pageviews,bounce_rate,avg_duration`;

        const statsRes = await fetch(statsUrl, {
            headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
        });

        let statsData = { data: [] };
        if (statsRes.ok) {
            statsData = await statsRes.json();
        }

        // 3. Fetch Top Pages
        const topPagesUrl = `https://api.vercel.com/v1/analytics/stats/query?projectId=${VERCEL_PROJECT_ID}${teamParam}&from=${sevenDaysAgo.toISOString()}&to=${now.toISOString()}&metrics=pageviews&groupBy=path&limit=10`;

        const topPagesRes = await fetch(topPagesUrl, {
            headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
        });

        let topPagesData = { data: [] };
        if (topPagesRes.ok) {
            topPagesData = await topPagesRes.json();
        }

        return new Response(
            JSON.stringify({
                project: {
                    name: projectData.name,
                    framework: projectData.framework,
                    link: projectData.link
                },
                analytics: statsData.data || [],
                topPages: topPagesData.data || [],
                timestamp: new Date().toISOString()
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
