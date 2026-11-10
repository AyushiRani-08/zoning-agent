zoning-agent/
  client/                      # Next.js app
    app/                       # routes (login, dashboard, new-study, reports/[id])
    components/                # MapView, PlotDrawTool, ResultCard, VerdictBadge
    lib/                       # api client, auth helpers
    types/
  server/
    src/
      app.js                   # express setup
      server.js                # bootstrap
      config/                  # env, db connection
      routes/                  # auth, feasibility, reports, admin, regions
      controllers/
      middleware/              # auth, validate, rateLimit, errorHandler
      services/
        geometry/              # validate, project, area, setback, buffer
        zoning/                # zone lookup
        rules/                 # rule retrieval and versioning
        feasibility/           # orchestration, verdict
        agent/                 # llm client, tools, prompts, extraction
        report/                # pdf templates and rendering
      models/                  # mongoose schemas
      schemas/                 # zod request and rule schemas
      utils/                   # errors, logger, constants
    tests/
      unit/ integration/ fixtures/   # fixtures = your hand-verified plots
    scripts/                   # seed-zones, seed-rules, extract-rules
  data/                        # raw and processed zoning data (not secrets)
  docs/                        # PRD, architecture, ADRs
  .github/workflows/           # CI
  README.md