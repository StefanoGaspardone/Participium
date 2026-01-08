# TEMPLATE FOR RETROSPECTIVE 4 (Team 05)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs done : 7 / 7
- Total points committed vs done : 26 / 26
- Nr of hours planned vs spent (as a team) : 80h  / 78h 22m

**Remember** a story is done ONLY if it fits the Definition of Done:

- Unit tests passing
- Integration tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _#0_   |   16      |    -   |     58h 10m       |    57h 48m          |
| 10      |     9    |    5    |      10h 15m      |         9h 23m     |
| 13      |     9    |    8    |      3h 30m      |       3h 19m       |
| 14      |     3    |    3    |      1h 30m      |     1h 26m         |
| 15      |     4    |    1    |       1h 10m     |    1h 9m          |
| 18      |     5    |    5    |  2h 30m          |  2h 24m            |
| 28      |     4    |    1    |     1h 30m       |   1h 26m           |
| 30      |     3    |    3    |     1h 25m       |    1h 27m          |

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (average, standard deviation)
  
|            | Mean  | StDev |
| ---------- |------ |-------|
| Estimation | 1h 31m | 3h 21m |
| Actual     | 1h 29m | 3h 29m |

- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1: 

  $$\frac{\sum_i estimation_{task_i}}{\sum_i spent_{task_i}} - 1$$ = 0.0207 (2.07%)
 
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n:

  $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| $$ = 0.1839 (18.39%) 

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated: 2h 20m
  - Total hours spent: 1h 50m
  - Nr of automated unit test cases: 228
  - Coverage (if available): 93.34%
- Integration testing:
  - Total hours estimated: 2h 30m
  - Total hours spent: 2h 20m
  - Nr of automated integration test cases: 352 
  - Coverage (if available): 92.75%
- E2E testing:
  - Total hours estimated: 2h 20m
  - Total hours spent: 1h 50m
  - Nr of automated E2E test cases: 236
  - Coverage (if available): 85.83%
- UI testing:
  - Total hours estimated: 8h
  - Total hours spent: 7h 25m
  - Nr of automated UI test cases: 86
  - Coverage (if available): 78.50%
- Test refactor:
  - Total hours estimated: 2h 30m
  - Total hours spent: 2h 30m
- Code review:
  - Total hours estimated: 2h
  - Total hours spent: 1h 36m
- Technical Debt management:
  - Strategy adopted: 
    > Team members review SonarQube Cloud at every merge to the main branch and decide on how to act (e.g., fix immediately, create a TD task, or accept the issue with justification).
    
    > Team members check the real-time analysis in the IDE before committing code to be aware of the issues they might introduce and decide on how to act.

  - Total hours estimated estimated at sprint planning: 8h
  - Total hours spent: 8h 5m

## ASSESSMENT

- What caused your errors in estimation (if any)?
  
  > We didn't have any major errors in estimation compared to last sprints.

- What lessons did you learn (both positive and negative) in this sprint?

  >  Negative: Deployment and Demo Preparation could have been anticipated.
  
  >  Positive: We improved in UI tests and solved major TD issues.

- Which improvement goals set in the previous retrospective were you able to achieve?
  
  > We achieved all of them.
  
- Which ones you were not able to achieve? Why?

  > None.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  
  > Resolve duplication issues on Sonarcloud for Quality Gate.  
  > Improve telegram bot experience.

- One thing you are proud of as a Team!!

  > We are Powerpuff Girls!  
  > We overcome all problems that arise without blaming anyone and help each other!
  
    ![Powerpuff Girls](./powerpuff_girls.jpg)
