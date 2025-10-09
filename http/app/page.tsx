// Documentation page for HTTP transport deployment
export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>PGHL MCP Server</h1>
      <p>This is an MCP server for PGHL (Pacific Girls Hockey League) schedule data.</p>
      <p><em>Supports dual transports: STDIO (local) and HTTP (remote deployment)</em></p>
      <h2>Usage</h2>
      <ul>
        <li><strong>STDIO</strong>: <code>npx @joerawr/pghl-mcp</code></li>
        <li><strong>HTTP</strong>: <code>{typeof window !== 'undefined' ? window.location.origin : 'https://pghl-mcp.vercel.app'}/api/mcp</code></li>
      </ul>
      <h2>Available Tools</h2>
      <ul>
        <li><strong>list_schedule_options</strong> - Discover seasons, divisions, and teams</li>
        <li><strong>get_schedule</strong> - Get full team schedule</li>
      </ul>
      <h2>Future Tools</h2>
      <p><em>Waiting for SCAHA-MCP implementation:</em></p>
      <ul>
        <li>get_team_stats - Team standings</li>
        <li>get_player_stats - Player/goalie statistics</li>
      </ul>
    </div>
  )
}
