# Technical Debt Management

## Code Quality Checks Within The Sprint Activities

- In order to maintain code quality, we will be using SonarQube Server's integration with GitHub; adding the analysis process into our pipeline. SonarScanners that runs on GitHub Actions will automatically keep an eye on our main and dev branch. Analysis will be performed everytime we introduce changes into these branches.

- Team members will review SonarQube at every PR and will decide how to act (e.g., fix immediately, create a TD task, or accept the issue with justification).

## Flow of Paying Back Technical Debt

### Priorities

Decision to address technical debt will depend on the severity of the TD item, its importance and the required remediation time.

- High severity, valuable impact and short remedy time TD items will be considered first and treated as soon as possible.
- High severity, valuable impact and long remedy time TD items will be discussed further based on how much time we can allocate.
- The remaining severities will be treated only once the ones above are treated and we have time to address such issues.

### Workflow

- TD items will be identified by automated detection and we will decide as a team what needs to be addressed based on our priority criterias.

- We will allocate time (no more than 15% of the sprint time) considering the status of our technical debt on each sprint planning.

- A task for managing technical debt called "Technical Debt" will be added.

### Internal Organisation

- Technical debt issues will be resolved by the original implementers.

- We will evaluate our strategy at every retrospective.

- If the original implementer is unavailable, the task will be reassigned to another team member familiar with that area of the codebase.
