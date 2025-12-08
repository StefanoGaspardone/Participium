# Technical Debt Management

## Code Quality Checks Within The Sprint Activities

- In order to maintain code quality, we will be using two approaches:
  - **SonarQube Cloud Integration with GitHub**: Adding the analysis process into our pipeline. SonarScanner that runs on GitHub Actions will automatically keep an eye on our main branch.           Analysis will be performed every time we introduce changes into the branch.
  - **SonarQube for IDE**: Real-time code analysis in the IDE.

- Team members will review SonarQube Cloud at every merge to the main branch and will decide on how to act (e.g., fix immediately, create a TD task, or accept the issue with justification).
- Team members will check the real-time analysis in the IDE before committing code to be aware of the issues they might introduce and decide on how to act.

## Flow of Paying Back Technical Debt

### Priorities

Decision to address technical debt will depend on the severity of the TD item, its importance and the required remediation time.

- High severity, valuable impact and short remedy time TD items will be considered first and treated as soon as possible.
- High severity, valuable impact and long remedy time TD items will be discussed further based on how much time we can allocate.
- The remaining severities will be treated only once the ones above are treated and we have time to address such issues.

### Workflow

- TD items will be identified by automated detection and in most cases we will decide as a team what needs to be addressed based on our priority criteria.

- With real-time code analysis in the IDE, we will individually assess the issues that might arise.

- We will allocate time (no more than 15% of the sprint time) considering the status of our technical debt at each sprint planning.

- A task for managing technical debt called "Technical Debt Management" will be added.

### Internal Organisation

- Technical debt issues will be resolved by the original implementers.

- We will evaluate our strategy at every retrospective.

- If the original implementer is unavailable, the task will be reassigned to another team member familiar with that area of the codebase.
