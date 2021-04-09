package com.amihaeseisergiu.citytripplanner.utils;

import com.amihaeseisergiu.citytripplanner.itinerary.Route;
import com.amihaeseisergiu.citytripplanner.itinerary.RoutePoi;
import com.amihaeseisergiu.citytripplanner.planner.schedule.ScheduleDay;
import lombok.AllArgsConstructor;
import org.chocosolver.solver.Model;
import org.chocosolver.solver.Solution;
import org.chocosolver.solver.Solver;
import org.chocosolver.solver.variables.IntVar;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@AllArgsConstructor
public class SolverUtils {

    private final MapboxUtils mapboxUtils;

    public Route getRoute(ScheduleDay scheduleDay, int[][] timeCost)
    {
        Route route = new Route(scheduleDay);

        int n = scheduleDay.getPois().size();

        int dayStart = scheduleDay.getDayStart();
        int dayEnd = scheduleDay.getDayEnd();
        int[] openingTimes = scheduleDay.getOpeningTimes();
        int[] closingTimes = scheduleDay.getClosingTimes();
        int[] visitDurations = scheduleDay.getVisitDurations();
        int accommodation = scheduleDay.getIndexOfAccommodation();

        Model model = new Model("City Planner");

        IntVar[] visitTimesSt = new IntVar[n];
        IntVar[] visitTimesEn = new IntVar[n];
        for(int i = 0; i < n; i++)
        {
            if(i == accommodation)
            {
                visitTimesSt[i] = model.intVar("visitTimesSt_" + i, dayStart);
                visitTimesEn[i] = model.intVar("visitTimesEn_" + i, dayStart, dayEnd);
            }
            else
            {
                try
                {
                    visitTimesSt[i] = model.intVar("visitTimesSt_" + i, Math.max(dayStart, openingTimes[i]), Math.min(dayEnd, closingTimes[i] - visitDurations[i]));
                    visitTimesEn[i] = model.intVar("visitTimesEn_" + i, Math.max(dayStart, openingTimes[i]) + visitDurations[i], Math.min(dayEnd, closingTimes[i]));
                }
                catch(Exception e)
                {
                    return route;
                }
            }
        }

        IntVar[] ord = model.intVarArray("ord", n, 0, n - 1);
        IntVar[] succCost = model.intVarArray("succCost", n, 0, 1440);
        IntVar totalTimeCost = model.intVar("Total time cost", 0, 1440);

        if(accommodation != -1)
        {
            ord[accommodation].eq(0).post();
        }

        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < n; j++)
            {
                if(i != j)
                {
                    if(i != accommodation)
                    {
                        model.ifThen(
                                ord[i].add(1).eq(ord[j]).and(ord[i].ne(n - 1)).decompose().reify(),
                                succCost[i].eq(model.intVar(openingTimes[j]).sub(visitTimesEn[i].add(timeCost[i][j])).max(0)
                                        .add(timeCost[i][j]).add(visitDurations[i])).decompose()
                        );
                    }
                    else
                    {
                        model.ifThen(
                                ord[i].add(1).eq(ord[j]).decompose().reify(),
                                succCost[i].eq(model.intVar(openingTimes[j]).sub(visitTimesSt[i].add(timeCost[i][j])).max(0)
                                        .add(timeCost[i][j])).decompose()
                        );
                    }

                    model.ifThen(
                            ord[i].sub(1).eq(ord[j]).decompose().reify(),
                            visitTimesSt[i].eq(visitTimesSt[j].add(succCost[j])).decompose()
                    );
                }
            }

            if(i != accommodation)
            {
                visitTimesEn[i].eq(visitTimesSt[i].add(visitDurations[i])).post();
            }

            if(accommodation != -1)
            {
                model.ifThen(
                        ord[i].eq(n - 1).decompose().reify(),
                        succCost[i].ge(timeCost[i][accommodation] + visitDurations[i])
                                .and(visitTimesSt[i].add(succCost[i]).eq(visitTimesEn[accommodation])).decompose()
                );
            }
            else
            {
                model.ifThen(
                        ord[i].eq(n - 1).decompose().reify(),
                        succCost[i].eq(visitDurations[i]).decompose()
                );
            }
        }

        model.allDifferent(ord).post();

        model.sum(succCost, "=", totalTimeCost).post();
        model.setObjective(Model.MINIMIZE, totalTimeCost);

        Solver solver = model.getSolver();
        Solution solution = new Solution(model);

        solver.showShortStatistics();
        while(solver.solve()){
            solution.record();
        }

        if(solution.exists())
        {
            List<RoutePoi> routePois = new ArrayList<>();

            for (int i = 0; i < n; i++)
            {
                String id = scheduleDay.getPois().get(i).getPoiId();
                int order = solution.getIntVal(ord[i]);

                int visitTimesStVal = solution.getIntVal(visitTimesSt[i]);
                String visitTimesStart = visitTimesStVal / 60 + ":" + ( (visitTimesStVal % 60) < 10 ? "0" + (visitTimesStVal % 60) : (visitTimesStVal % 60));

                int visitTimesEnVal = solution.getIntVal(visitTimesEn[i]);
                String visitTimesEnd = visitTimesEnVal / 60 + ":" + ( (visitTimesEnVal % 60) < 10 ? "0" + (visitTimesEnVal % 60) : (visitTimesEnVal % 60));

                int timeToNextPoi = -1;
                int waitingTime = -1;
                String polyLine = null;
                if(order != n - 1)
                {
                    for(int j = 0; j < n; j++)
                    {
                        if(i != j && solution.getIntVal(ord[j]) == order + 1)
                        {
                            timeToNextPoi = timeCost[i][j];

                            if(accommodation != -1 && order == 0)
                            {
                                waitingTime = solution.getIntVal(succCost[i]) - timeToNextPoi;
                            }
                            else
                            {
                                waitingTime = solution.getIntVal(succCost[i]) - visitDurations[i] - timeToNextPoi;
                            }

                            polyLine = mapboxUtils.fetchPolyLine(scheduleDay.getPois().get(i).getCoordsString(),
                                    scheduleDay.getPois().get(j).getCoordsString());
                            break;
                        }
                    }
                }
                else if(accommodation != -1)
                {
                    timeToNextPoi = timeCost[i][accommodation];
                    waitingTime = solution.getIntVal(succCost[i]) - visitDurations[i] - timeToNextPoi;
                    polyLine = mapboxUtils.fetchPolyLine(scheduleDay.getPois().get(i).getCoordsString(),
                            scheduleDay.getPois().get(accommodation).getCoordsString());
                }

                routePois.add(new RoutePoi(id, order, visitTimesStart, visitTimesEnd, timeToNextPoi, waitingTime, polyLine));
            }

            route.setPois(routePois);

            if(accommodation != -1)
            {
                route.setAccommodation(scheduleDay.getAccommodation());
            }
        }
        return route;
    }

    public void getRoutesUnrestricted()
    {
        int m = 7;
        int n = 3;

        int[] dayNumbers = new int[]{0, 1, 2, 3, 4, 5, 6};
        int[] daysStart = new int[]{360, 360, 360, 360, 360, 360, 360};
        int[] daysEnd = new int[]{1080, 1080, 1080, 1080, 1080, 1080, 1080};

        int[][] openingTimes = new int[][]{
                {360, 360, 360, 360, 360, 360, 360},
                {1000, 360, 360, 360, 360, 360, 360},
                {400, 360, 360, 360, 360, 360, 360},
                {1000, 360, 360, 360, 360, 360, 360}
        };
        int[][] closingTimes = new int[][]{
                {460, 1080, 1080, 1080, 1080, 1080, 1080},
                {1060, 1080, 1080, 1080, 1080, 1080, 1080},
                {480, 1080, 1080, 1080, 1080, 1080, 1080},
                {1060, 1080, 1080, 1080, 1080, 1080, 1080}
        };
        int[] visitDurations = new int[]{60, 60, 60, 60};
        int accommodation = 3;

        int[][] timeCost = new int[][]{
                {0, 5, 3, 4},
                {5, 0, 10, 5},
                {3, 10, 0, 6},
                {4, 5, 6, 0},
        };

        Model model = new Model("City Planner Unrestricted");

        IntVar[] visitTimesSt = model.intVarArray("visitTimesSt", n, 0, 1440);
        IntVar[] visitTimesEn = model.intVarArray("visitTimesEn", n, 0, 1440);

        IntVar[] ord = model.intVarArray("ord", n, 0, n - 1);
        IntVar[] day = model.intVarArray("day", n, 0, m - 1);
        IntVar[] surplus = model.intVarArray("surplus", m, 0, 1440);

        IntVar[] succCost = model.intVarArray("succCost", n, 0, 1440);
        IntVar totalTimeCost = model.intVar("Total time cost", 0, m * 1440);

        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < n; j++)
            {
                for(int k = 0; k < m; k++)
                {
                    model.ifThen(
                            day[i].eq(k).decompose().reify(),
                            visitTimesSt[i].ge(Math.max(daysStart[k], openingTimes[i][dayNumbers[k]]))
                                    .and(visitTimesSt[i].le(Math.min(daysEnd[k], closingTimes[i][dayNumbers[k]] - visitDurations[i])))
                                    .and(visitTimesEn[i].ge(Math.max(daysStart[k], openingTimes[i][dayNumbers[k]]) + visitDurations[i]))
                                    .and(visitTimesEn[i].le(Math.min(daysEnd[k], closingTimes[i][dayNumbers[k]]))).decompose()
                    );

                    if(i != j)
                    {
                        model.ifThen(
                                ord[i].add(1).eq(ord[j]).and(day[i].eq(k).and(day[i].eq(day[j]))).decompose().reify(),
                                succCost[i].eq(model.intVar(openingTimes[j][dayNumbers[k]]).sub(visitTimesEn[i].add(timeCost[i][j])).max(0)
                                        .add(timeCost[i][j]).add(visitDurations[i])).decompose()
                        );

                        if(accommodation != -1)
                        {
                            model.ifThen(
                                    ord[i].add(1).eq(ord[j]).and(day[i].eq(k).and(day[i].ne(day[j]))).decompose().reify(),
                                    succCost[i].eq(surplus[k].add(timeCost[i][accommodation] + visitDurations[i]))
                                            .and(visitTimesSt[i].add(timeCost[i][accommodation] + visitDurations[i]).le(daysEnd[k])).decompose()
                            );

                            model.ifThen(
                                    ord[i].eq(n - 1).and(day[i].eq(k)).decompose().reify(),
                                    succCost[i].eq(surplus[k].add(timeCost[i][accommodation] + visitDurations[i]))
                                            .and(visitTimesSt[i].add(timeCost[i][accommodation] + visitDurations[i]).le(daysEnd[k])).decompose()
                            );

                            model.ifThen(
                                    ord[i].sub(1).eq(ord[j]).and(day[i].eq(k).and(day[i].ne(day[j]))).decompose().reify(),
                                    visitTimesSt[i].eq(model.intVar(openingTimes[i][dayNumbers[k]]).sub(model.intVar(daysStart[k])
                                            .add(timeCost[accommodation][i])).max(0).add(timeCost[accommodation][i]).add(daysStart[k]))
                                            .and(surplus[k].eq(visitTimesSt[i].sub(daysStart[k]))).decompose()
                            );

                            model.ifThen(
                                    ord[i].eq(0).and(day[i].eq(k)).decompose().reify(),
                                    visitTimesSt[i].eq(model.intVar(openingTimes[i][dayNumbers[k]]).sub(model.intVar(daysStart[k])
                                            .add(timeCost[accommodation][i])).max(0).add(timeCost[accommodation][i]).add(daysStart[k]))
                                            .and(surplus[k].eq(visitTimesSt[i].sub(daysStart[k]))).decompose()
                            );
                        }
                    }
                }

                model.ifThen(
                        ord[i].sub(1).eq(ord[j]).and(day[i].eq(day[j])).decompose().reify(),
                        visitTimesSt[i].eq(visitTimesSt[j].add(succCost[j])).decompose()
                );

                model.ifThen(
                        ord[i].ne(n - 1).and(ord[i].add(1).eq(ord[j])).decompose(),
                        day[i].eq(day[j]).or(day[j].eq(day[i].add(1))).decompose()
                );

                if(accommodation == -1)
                {
                    model.ifThen(
                            ord[i].add(1).eq(ord[j]).and(day[i].ne(day[j])).decompose().reify(),
                            succCost[i].eq(visitDurations[i]).decompose()
                    );
                }
            }

            visitTimesEn[i].eq(visitTimesSt[i].add(visitDurations[i])).post();

            if(accommodation == -1)
            {
                model.ifThen(
                        ord[i].eq(n - 1).decompose().reify(),
                        succCost[i].eq(visitDurations[i]).decompose()
                );
            }
        }

        model.allDifferent(ord).post();

        model.sum(succCost, "=", totalTimeCost).post();
        model.setObjective(Model.MINIMIZE, totalTimeCost);

        Solver solver = model.getSolver();

        solver.showShortStatistics();
        while(solver.solve()){
            for (int i = 0; i < n; i++)
            {
                System.out.printf("day[%d]=%d ", i, day[i].getValue());
            }
            System.out.println();
            for (int i = 0; i < n; i++)
            {
                System.out.printf("ord[%d]=%d ", i, ord[i].getValue());
            }
            System.out.println();
            for (int i = 0; i < n; i++)
            {
                System.out.printf("vSt[%d]=%d ", i, visitTimesSt[i].getValue());
            }
            System.out.println();
            for (int i = 0; i < n; i++)
            {
                System.out.printf("vEn[%d]=%d ", i, visitTimesEn[i].getValue());
            }
            System.out.println();
            for (int i = 0; i < n; i++)
            {
                System.out.printf("sCo[%d]=%d ", i, succCost[i].getValue());
            }
            System.out.printf("\nTotal time cost = %d\n", totalTimeCost.getValue());
        }
    }
}
