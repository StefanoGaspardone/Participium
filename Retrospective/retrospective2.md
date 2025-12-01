# TEMPLATE FOR RETROSPECTIVE (Team 05)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs. done = 6/6
- Total points committed vs. done =  39/39
- Nr of hours planned vs. spent (as a team) = 80h 35m planned, 77h 47m tracked

**Remember**a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End (and Integration) tests performed

> Please refine your DoD if required (you cannot remove items!)

### Detailed statistics

| Story                         | # Tasks | Points | Hours est. | Hours actual |
|-------------------------------|---------|--------|------------|--------------|
| _Uncategorized_               | 18      | -      | 51h 35m    | 50h 52m      |
| Manage pending report         | 9       | 2      | 5h 10m     | 4h 12m       |
| See approved reports on map   | 2       | 13     | 2h         | 1h 38m       |
| View assigned report          | 6       |  1     | 3h 45m     | 2h 21m       |
| Configure account settings    | 8       |  2     | 4h 10m     | 3h 56m       |
| Update report status          | 14      |  8     | 8h 35m     | 9h 40m       |
| Create report on telegram bot | 5       |  13    | 5h 20m     | 5h 8m        |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
| ---------- |------|-------|
| Estimation |  1.3 |  1.95 |
| Actual     |  1.25|  1.90 |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

$ \frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = -0.0347 $

  $3.47\% $ underestimation 

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

  $\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0.2113 $

  $ 21.13\% $ average error per task

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated = 2h
  - Total hours spent = 2h 30m
  - Nr of automated unit test cases = 119
  - Coverage = 97%
- Integration testing:
  - Total hours estimated = 2h
  - Total hours spent = 2h 45m
  - Nr of test cases = 157
  - Coverage = 92.8%
- E2E testing:
  - Total hours estimated = 2h 30m 
  - Total hours spent = 3h
  - Nr of test cases = 112
  - Coverage = 85%
- Code review
  - Total hours estimated = 3h
  - Total hours spent = 1h 30m

## ASSESSMENT

- What did go wrong in the sprint?

  > We struggle with frontend testing because we changed it after writing
  > the tests and we did not have time to spend on it. 

- What caused your errors in estimation (if any)?

  > We underestimated tests for story 11 becuase we did not expect to 
  > have that many new classes to test.
  > For frontend tests as well we underestimated the time needed.

- What lessons did you learn (both positive and negative) in this sprint?

  > Positive: We estimated more accurately overall the tasks.
  > Negative: Frontend testing takes more time than expected.

- Which improvement goals set in the previous retrospective were you able to achieve?

  > Better task estimation
  > better frontend styling, even if not perfect yet

- Which ones you were not able to achieve? Why?

  > We still have to work on frontend styling

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > 1. Better frontend testing
  > 2. We should add time to refactor code and pay technical debt
  > 3. work on frontend styling

- One thing you are proud of as a Team !!

  > We are Powerpuff Girls, we overcome all problems that arise without blaming anyone and help each other
  
    ![Powerpuff Girls](./powerpuff_girls.jpg)
