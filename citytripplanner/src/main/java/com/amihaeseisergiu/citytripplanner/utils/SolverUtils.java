package com.amihaeseisergiu.citytripplanner.utils;

import com.amihaeseisergiu.citytripplanner.route.Route;
import com.amihaeseisergiu.citytripplanner.route.RoutePoi;
import com.amihaeseisergiu.citytripplanner.schedule.Schedule;
import lombok.AllArgsConstructor;
import org.chocosolver.solver.Model;
import org.chocosolver.solver.Solution;
import org.chocosolver.solver.Solver;
import org.chocosolver.solver.variables.IntVar;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@AllArgsConstructor
public class SolverUtils {

    private final MapboxUtils mapboxUtils;

    public Route getRoute(Schedule schedule, DurationsMatrix durationsMatrix)
    {
        Route route = new Route(schedule);

        int n = schedule.getPois().size();
        int max = durationsMatrix.getMax();

        int dayStart = schedule.getDayStart();
        int dayEnd = schedule.getDayEnd();
        int[] openingTimes = schedule.getOpeningTimes();
        int[] closingTimes = schedule.getClosingTimes();
        int[] visitDurations = schedule.getVisitDurations();

        int[][] timeCost = durationsMatrix.getDurationsMatrix();

        Model model = new Model("City Planner");

        IntVar[] visitTimesSt = new IntVar[n];
        IntVar[] visitTimesEn = new IntVar[n];
        for(int i = 0; i < n; i++)
        {
            try
            {
                visitTimesSt[i] = model.intVar("visitTimesSt_" + i, Math.max(dayStart, openingTimes[i]), Math.min(dayEnd, closingTimes[i] - visitDurations[i]));
                visitTimesEn[i] = model.intVar("visitTimesEn_" + i, Math.max(dayStart, openingTimes[i]) + visitDurations[i], Math.min(dayEnd, closingTimes[i]));
            }
            catch (Exception e)
            {
                return route;
            }
        }

        IntVar[] ord = model.intVarArray("ord", n, 0, n - 1);
        IntVar[] succCost = model.intVarArray("succCost", n, 0, Arrays.stream(visitDurations).sum() + max * n);
        IntVar totalTimeCost = model.intVar("Total time cost", 0, Arrays.stream(visitDurations).sum() + max * n);

        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < n; j++)
            {
                if(i != j)
                {
                    model.ifThen(
                            model.and(model.arithm(ord[i].add(1).intVar(), "=", ord[j]), model.arithm(ord[i], "!=", n - 1)),
                            model.arithm(succCost[i], "=", model.intVar(openingTimes[j]).sub(visitTimesEn[i].add(timeCost[i][j])).max(0)
                                    .add(timeCost[i][j]).add(visitDurations[i]).intVar())
                    );

                    model.ifThen(
                            model.arithm(ord[i].intVar(), "=", n - 1),
                            model.arithm(succCost[i], "=", visitDurations[i])
                    );
                }
            }
        }

        model.allDifferent(ord).post();

        for(int i = 0; i < n; i++)
        {
            model.arithm(visitTimesEn[i], "=", visitTimesSt[i], "+", visitDurations[i]).post();
            for(int j = 0; j < n; j++)
            {
                if(i != j)
                    model.ifThen(
                            model.and(model.arithm(ord[i].sub(1).intVar(), ">=", 0), model.arithm(ord[i].sub(1).intVar(), "=", ord[j])),
                            model.arithm(visitTimesSt[i], "=", visitTimesSt[j], "+", succCost[j])
                    );
            }
        }

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
                String id = schedule.getPois().get(i).getId();
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
                            polyLine = mapboxUtils.fetchPolyLine(schedule.getPois().get(i), schedule.getPois().get(j));
                            break;
                        }
                    }
                }

                routePois.add(new RoutePoi(id, order, visitTimesStart, visitTimesEnd, timeToNextPoi, waitingTime, polyLine));
            }

            route.setPois(routePois);
        }
        return route;
    }
}
