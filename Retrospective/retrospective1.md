# TEMPLATE FOR RETROSPECTIVE (Team 05)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs. done = 5
- Total points committed vs. done = 11
- Nr of hours planned vs. spent (as a team) = planned:80h, spent:74h16m

**Remember**a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End (and Integration) tests performed

> Please refine your DoD if required (you cannot remove items!)

### Detailed statistics

| Story                          | # Tasks | Points | Hours est. | Hours actual |
|--------------------------------|---------|--------|------------|--------------|
| _Uncategorized_                | 18      | -      | 55h 35m    | 49h 10m      |
| Register user                  | 9       | 2      | 7h 30m     | 9h 7m        |
| register municipality user     | 8       | 1      | 5h 20m     | 5h 22m       |
| assign municipality user roles | 5       | 1      | 2h 30m     | 1h 57m       |
| get location                   | 5       | 5      | 4h         | 3h 31m       |
| create report                  | 9       | 2      | 5h 5m      | 5h 9m        |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
| ---------- |------|-------|
| Estimation | 1.481 | 2.580 |
| Actual     | 1.375| 2.317 |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

  $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$ = -0.0717

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

  $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| $$ = 0.1506

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated = 9h
  - Total hours spent = 9h 30m
  - Nr of automated unit test cases = 28
  - Coverage = >92%
- E2E testing:
  - Total hours estimated = 2h 30m
  - Total hours spent = 2h 30m
  - Nr of test cases = 28
- Code review
  - Total hours estimated = 2h 30m
  - Total hours spent = 1h 59m

## ASSESSMENT

- What did go wrong in the sprint?

  > We were not able to fully point out all the tasks in the beginning, so we had to add new ones during the sprint.

- What caused your errors in estimation (if any)?

  > At the beginning we thought that retrospective was part of the sprint, but we also had to add new tasks so overall the estimation was right and the actual time spent was a little bit shorter.

- What lessons did you learn (both positive and negative) in this sprint?

  > Positive: We have gotten better at estimating task duration and sub-categorising the tasks into smaller pieces compared to the very first sprint.
  > Negative: We learned that we should have a task for bug fixing or any other problems that may arise.

- Which improvement goals set in the previous retrospective were you able to achieve?

  > This time we assigned all the tasks in the beginning of the sprint.
  > The communication among us was better during the work and not only at the end of each task

- Which ones you were not able to achieve? Why?

  > We still have to improve task estimation, because we were not able to point out every task from the beginning.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > 1. better task estimation: we should spend more time in the sprint planning to analyze what can go wrong and what tasks can arise
  > 2. improve frontend style: we should spend time on restyling the frontend to make it more user-friendly and nice looking

- One thing you are proud of as a Team !!

  > We are Powerpuff Girls, we overcome all problems that arise without blaming anyone and help each other

  ![Powerpuff Girls](./powerpuff_girls.jpg)
