<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Daily runs

The daily run takes the searches saved in `profile.yaml` and handles only jobs posted since the last run.

## Saved searches

```yaml
saved_searches:
  - { name: react-remote, ask: remote React developer jobs in Europe }
  - { name: dubai-devops, ask: DevOps jobs in Dubai, mode: review }
```

`mode` is optional and overrides `settings.mode` for that search. To add one, ask the user for the words they'd normally type, then add the line (after showing the diff).

## "daily run"

For each saved search:
1. Run Steps 2 and 3 of SKILL.md for its `ask`, with `posted_within_days: 1`.
2. Queue the result in its mode (Step 4) and run it (Step 5):
   - **auto:** applies up to the daily cap.
   - **review:** prepares only, then `JA review build`. Tell the user: "N applications are ready for review: run /job-autopilot review". Nothing is submitted until they approve.
   - **dry-run:** prepares only.
3. Finish with the Step 7 report.

## Scheduling

**While a Claude Code session is open (simplest):**

```
/loop 24h /job-autopilot daily run
```

**Unattended (cron, Linux / macOS / WSL).** Unattended runs can't solve CAPTCHAs or answer questions, so use `review` or `dry-run` for anything you haven't run in auto before. `crontab -e`, then:

```
0 9 * * * DISPLAY=:0 claude -p "/job-autopilot daily run" --allowedTools "Bash,Read,Write,Edit,Agent,Skill,mcp__freehire,mcp__job-browser" >> ~/.job-autopilot/daily.log 2>&1
```

- **Codex:** `codex exec "Use the job-autopilot skill: daily run"` in the same place.
- **Servers without a display:** run setup with `--headless` once.
- **Windows Task Scheduler:** action `claude`, arguments `-p "/job-autopilot daily run" --allowedTools "..."`, daily trigger.

Before adding a schedule, show the user the exact line, and add it only after they agree. Removing it is `crontab -e` again.
