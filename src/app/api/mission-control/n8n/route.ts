import { NextResponse } from 'next/server';

const N8N_API_URL = 'https://n8n.srv1266620.hstgr.cloud/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NWRkYjQxZi1jZjBkLTQwNTktYjQ0Yy0wYjM1ZDMwZmEwNGQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwMjQ0MzEyfQ.TErc0F46gea6YZ3y5c3yTrzUDN_dyyRc-Jrp3nQngz8';

// Key workflow IDs
const KEY_WORKFLOWS = {
  'Jedi Council (Full)': 'kQhVEuBRJw1NIusd',
  'GADS Weekly': 'n6O7OGLWSWmtzsDe',
  'Receipt Processor': 'SkAt1aohXt08slQ3',
};

// GET /api/mission-control/n8n - Fetch workflow statuses
export async function GET() {
  try {
    const workflowPromises = Object.entries(KEY_WORKFLOWS).map(async ([name, id]) => {
      try {
        // Fetch workflow info
        const workflowRes = await fetch(`${N8N_API_URL}/workflows/${id}`, {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (!workflowRes.ok) {
          return {
            id,
            name,
            active: false,
            error: `Failed to fetch workflow (${workflowRes.status})`,
          };
        }

        const workflow = await workflowRes.json();

        // Fetch recent executions
        const executionsRes = await fetch(
          `${N8N_API_URL}/executions?workflowId=${id}&limit=10`,
          {
            headers: {
              'X-N8N-API-KEY': N8N_API_KEY,
              'Content-Type': 'application/json',
            },
          }
        );

        let executions = [];
        let lastExecution = null;
        let lastExecutionStatus = null;

        if (executionsRes.ok) {
          const executionsData = await executionsRes.json();
          executions = executionsData.data || [];
          
          if (executions.length > 0) {
            lastExecution = executions[0];
            lastExecutionStatus = lastExecution.finished 
              ? lastExecution.status 
              : 'running';
          }
        }

        return {
          id,
          name,
          active: workflow.active || false,
          lastExecutionTime: lastExecution?.startedAt || null,
          lastExecutionStatus: lastExecutionStatus,
          executionCount: executions.length,
          recentExecutions: executions.slice(0, 5).map((exec: any) => ({
            id: exec.id,
            startedAt: exec.startedAt,
            stoppedAt: exec.stoppedAt,
            status: exec.finished ? exec.status : 'running',
          })),
        };
      } catch (error) {
        console.error(`Error fetching workflow ${name}:`, error);
        return {
          id,
          name,
          active: false,
          error: 'Failed to fetch workflow data',
        };
      }
    });

    const workflows = await Promise.all(workflowPromises);

    return NextResponse.json({ 
      workflows,
      mockData: false 
    });
  } catch (error) {
    console.error('Error fetching n8n workflows:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch n8n workflows',
      mockData: true 
    }, { status: 500 });
  }
}
