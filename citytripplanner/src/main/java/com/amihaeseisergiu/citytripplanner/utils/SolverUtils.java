package com.amihaeseisergiu.citytripplanner.utils;

import com.amihaeseisergiu.citytripplanner.itinerary.route.Route;
import com.amihaeseisergiu.citytripplanner.itinerary.route.poi.RoutePoi;
import com.amihaeseisergiu.citytripplanner.schedule.day.ScheduleDay;
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
                    model.ifThen(
                            ord[i].add(1).eq(ord[j]).and(ord[i].ne(n - 1)).decompose().reify(),
                            succCost[i].ge(timeCost[i][j] + visitDurations[i]).decompose()
                    );

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
                            waitingTime = solution.getIntVal(succCost[i]) - visitDurations[i] - timeToNextPoi;
                            polyLine = mapboxUtils.fetchPolyLine(scheduleDay.getPois().get(i), scheduleDay.getPois().get(j));
                            break;
                        }
                    }
                }
                else if(accommodation != -1)
                {
                    timeToNextPoi = timeCost[i][accommodation];
                    waitingTime = solution.getIntVal(succCost[i]) - visitDurations[i] - timeToNextPoi;
                    polyLine = mapboxUtils.fetchPolyLine(scheduleDay.getPois().get(i), scheduleDay.getPois().get(accommodation));
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
}
