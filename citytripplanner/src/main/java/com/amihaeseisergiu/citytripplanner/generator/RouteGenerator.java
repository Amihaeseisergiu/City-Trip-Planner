package com.amihaeseisergiu.citytripplanner.generator;

import com.amihaeseisergiu.citytripplanner.itinerary.Route;
import com.amihaeseisergiu.citytripplanner.itinerary.RoutePoi;
import com.amihaeseisergiu.citytripplanner.planner.schedule.ScheduleDay;
import com.amihaeseisergiu.citytripplanner.planner.scheduleunrestricted.*;
import com.amihaeseisergiu.citytripplanner.utils.MapboxUtils;
import lombok.AllArgsConstructor;
import org.chocosolver.solver.Model;
import org.chocosolver.solver.Solution;
import org.chocosolver.solver.Solver;
import org.chocosolver.solver.constraints.Constraint;
import org.chocosolver.solver.constraints.nary.cnf.LogOp;
import org.chocosolver.solver.variables.IntVar;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Component
@AllArgsConstructor
public class RouteGenerator {

    private final MapboxUtils mapboxUtils;

    public DataRestricted getRouteRestricted(ScheduleDay scheduleDay, int[][] timeCost)
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
                    return new DataRestricted(route, null);
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
                        new Constraint("NextVenueConstraint", new NextVenuePropagator(n, i, j, ord, succCost,
                                visitTimesEn, openingTimes, timeCost, visitDurations)).post();
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
        return new DataRestricted(route, model.toString());
    }

    public DataUnrestricted getRoutesUnrestricted(ScheduleUnrestricted schedule, int[][] timeCost)
    {
        int m = schedule.getScheduleDays().size();
        int n = schedule.getSchedulePois().size();

        DayDataUnrestricted dayDataUnrestricted = schedule.getDayData();
        int[] dayNumbers = dayDataUnrestricted.getDayNumbers();
        int[] daysStart = dayDataUnrestricted.getDaysStart();
        int[] daysEnd = dayDataUnrestricted.getDaysEnd();

        PoiDataUnrestricted poiDataUnrestricted = schedule.getPoiData();
        int[][] openingTimes = poiDataUnrestricted.getOpeningTimes();
        int[][] closingTimes = poiDataUnrestricted.getClosingTimes();
        int[] visitDurations = poiDataUnrestricted.getVisitDurations();
        int accommodation = schedule.getIndexOfAccommodation();

        Model model = new Model("City Planner Unrestricted");

        IntVar[] visitTimesSt = model.intVarArray("visitTimesSt", n, 0, 1440, true);
        IntVar[] visitTimesEn = model.intVarArray("visitTimesEn", n, 0, 1440, true);

        IntVar[] ord = model.intVarArray("ord", n, 0, n - 1);
        IntVar[] day = model.intVarArray("day", n, 0, m - 1);
        IntVar[] surplus = model.intVarArray("surplus", m, 0, 1440, true);

        IntVar[] succCost = model.intVarArray("succCost", n, 0, 1440, true);
        IntVar totalTimeCost = model.intVar("Total time cost", 0, m * 1440, true);

        for(int i = 0; i < schedule.getSchedulePois().size(); i++)
        {
            Long dayOfPoi = schedule.getSchedulePois().get(i).getDay();
            if(dayOfPoi != null)
            {
                for(int j = 0; j < schedule.getScheduleDays().size(); j++)
                {
                    if(schedule.getScheduleDays().get(j).getDayId().equals(dayOfPoi))
                    {
                        model.arithm(day[i], "=", j).post();
                        break;
                    }
                }
            }
        }

        for(int i = 0; i < n; i++)
        {
            for(int k = 0; k < m; k++)
            {
                model.addClauses(LogOp.implies(
                        day[i].eq(k).decompose().reify(),
                        visitTimesSt[i].ge(Math.max(daysStart[k], openingTimes[i][dayNumbers[k]]))
                                .and(visitTimesSt[i].le(Math.min(daysEnd[k], closingTimes[i][dayNumbers[k]] - visitDurations[i])))
                                .and(visitTimesEn[i].ge(Math.max(daysStart[k], openingTimes[i][dayNumbers[k]]) + visitDurations[i]))
                                .and(visitTimesEn[i].le(Math.min(daysEnd[k], closingTimes[i][dayNumbers[k]]))).decompose().reify()
                ));

                if(accommodation != -1)
                {
                    model.addClauses(LogOp.implies(
                            ord[i].eq(n - 1).and(day[i].eq(k)).decompose().reify(),
                            succCost[i].eq(surplus[k].add(timeCost[i][accommodation] + visitDurations[i]))
                                    .and(visitTimesSt[i].add(timeCost[i][accommodation] + visitDurations[i]).le(daysEnd[k])).decompose().reify()
                    ));

                    model.addClauses(LogOp.implies(
                            ord[i].eq(0).and(day[i].eq(k)).decompose().reify(),
                            visitTimesSt[i].eq(model.intVar(openingTimes[i][dayNumbers[k]]).sub(model.intVar(daysStart[k])
                                    .add(timeCost[accommodation][i])).max(0).add(timeCost[accommodation][i]).add(daysStart[k]))
                                    .and(surplus[k].eq(visitTimesSt[i].sub(daysStart[k]))).decompose().reify()
                    ));
                }
            }
        }

        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < n; j++)
            {
                for(int k = 0; k < m; k++)
                {
                    if(i != j)
                    {
                        model.addClauses(LogOp.implies(
                                ord[i].add(1).eq(ord[j]).and(day[i].eq(k).and(day[i].eq(day[j]))).decompose().reify(),
                                succCost[i].eq(model.intVar(openingTimes[j][dayNumbers[k]]).sub(visitTimesEn[i].add(timeCost[i][j])).max(0)
                                        .add(timeCost[i][j]).add(visitDurations[i])).decompose().reify()
                        ));

                        if(accommodation != -1)
                        {
                            model.addClauses(LogOp.implies(
                                    ord[i].add(1).eq(ord[j]).and(day[i].eq(k).and(day[i].ne(day[j]))).decompose().reify(),
                                    succCost[i].eq(surplus[k].add(timeCost[i][accommodation] + visitDurations[i]))
                                            .and(visitTimesSt[i].add(timeCost[i][accommodation] + visitDurations[i]).le(daysEnd[k])).decompose().reify()
                            ));

                            model.addClauses(LogOp.implies(
                                    ord[i].sub(1).eq(ord[j]).and(day[i].eq(k).and(day[i].ne(day[j]))).decompose().reify(),
                                    visitTimesSt[i].eq(model.intVar(openingTimes[i][dayNumbers[k]]).sub(model.intVar(daysStart[k])
                                            .add(timeCost[accommodation][i])).max(0).add(timeCost[accommodation][i]).add(daysStart[k]))
                                            .and(surplus[k].eq(visitTimesSt[i].sub(daysStart[k]))).decompose().reify()
                            ));
                        }
                    }
                }

                model.addClauses(LogOp.implies(
                        ord[i].sub(1).eq(ord[j]).and(day[i].eq(day[j])).decompose().reify(),
                        visitTimesSt[i].eq(visitTimesSt[j].add(succCost[j])).decompose().reify()
                ));

                model.addClauses(LogOp.implies(
                        ord[i].ne(n - 1).and(ord[i].add(1).eq(ord[j])).decompose().reify(),
                        day[i].le(day[j]).decompose().reify()
                ));

                if(accommodation == -1)
                {
                    model.addClauses(LogOp.implies(
                            ord[i].add(1).eq(ord[j]).and(day[i].ne(day[j])).decompose().reify(),
                            succCost[i].eq(visitDurations[i]).decompose().reify()
                    ));
                }
            }

            visitTimesEn[i].eq(visitTimesSt[i].add(visitDurations[i])).post();

            if(accommodation == -1)
            {
                model.addClauses(LogOp.implies(
                        ord[i].eq(n - 1).decompose().reify(),
                        succCost[i].eq(visitDurations[i]).decompose().reify()
                ));
            }
        }

        model.allDifferent(ord).post();

        model.sum(succCost, "=", totalTimeCost).post();
        model.setObjective(Model.MINIMIZE, totalTimeCost);

        Solver solver = model.getSolver();
        solver.limitTime("60s");
        Solution solution = new Solution(model);

        solver.showShortStatistics();
        while(solver.solve()){
            solution.record();
        }

        List<Route> routes = new ArrayList<>();

        if(solution.exists())
        {
            for(int i = 0; i < n; i++)
            {
                ScheduleDayUnrestricted assignedDay = schedule.getScheduleDays().get(solution.getIntVal(day[i]));
                SchedulePoiUnrestricted poi = schedule.getSchedulePois().get(i);
                int order = solution.getIntVal(ord[i]);

                int visitTimesStVal = solution.getIntVal(visitTimesSt[i]);
                String visitTimesStart = visitTimesStVal / 60 + ":"
                        + ( (visitTimesStVal % 60) < 10 ? "0" + (visitTimesStVal % 60) : (visitTimesStVal % 60));

                int visitTimesEnVal = solution.getIntVal(visitTimesEn[i]);
                String visitTimesEnd = visitTimesEnVal / 60 + ":"
                        + ( (visitTimesEnVal % 60) < 10 ? "0" + (visitTimesEnVal % 60) : (visitTimesEnVal % 60));

                Route foundRoute = routes.stream().filter(r -> r.getDayId().equals(assignedDay.getDayId())).findFirst().orElse(null);

                if(foundRoute == null)
                {
                    Route route = new Route(assignedDay);

                    List<RoutePoi> routePois = new ArrayList<>();
                    routePois.add(new RoutePoi(i, poi.getPoiId(), order, visitTimesStart, visitTimesEnd,
                            null, null, null));

                    route.setPois(routePois);
                    routes.add(route);
                }
                else
                {
                    foundRoute.getPois().add(new RoutePoi(i, poi.getPoiId(), order, visitTimesStart, visitTimesEnd,
                            null, null, null));
                }
            }

            for(Route route : routes)
            {
                RoutePoi minOrderPoi = Collections.min(route.getPois(), Comparator.comparing(RoutePoi::getOrd));
                RoutePoi maxOrderPoi = Collections.max(route.getPois(), Comparator.comparing(RoutePoi::getOrd));
                int valueToNormalize = accommodation == -1 ? minOrderPoi.getOrd() : minOrderPoi.getOrd() - 1;

                for(RoutePoi routePoi : route.getPois())
                {
                    int newOrder = routePoi.getOrd() - valueToNormalize;
                    routePoi.setOrd(newOrder);
                }

                for(RoutePoi routePoi : route.getPois())
                {
                    RoutePoi successor = route.getPois().stream().filter(
                            p -> p.getOrd() == (routePoi.getOrd() + 1)).findFirst().orElse(null);

                    int timeToNextPoi = -1;
                    int waitingTime = -1;
                    String polyLine = null;

                    if(successor != null)
                    {
                        timeToNextPoi = timeCost[routePoi.getSolutionIndex()][successor.getSolutionIndex()];
                        waitingTime = solution.getIntVal(succCost[routePoi.getSolutionIndex()])
                                - visitDurations[routePoi.getSolutionIndex()] - timeToNextPoi;
                        polyLine = mapboxUtils.fetchPolyLine(schedule.getSchedulePois().get(routePoi.getSolutionIndex()).getCoordsString(),
                                schedule.getSchedulePois().get(successor.getSolutionIndex()).getCoordsString());
                    }
                    else if(accommodation != -1)
                    {
                        timeToNextPoi = timeCost[routePoi.getSolutionIndex()][accommodation];
                        polyLine = mapboxUtils.fetchPolyLine(schedule.getSchedulePois().get(routePoi.getSolutionIndex()).getCoordsString(),
                                schedule.getAccommodationPoi().getCoordsString());
                    }

                    routePoi.setTimeToNextPoi(timeToNextPoi);
                    routePoi.setWaitingTime(waitingTime);
                    routePoi.setPolyLine(polyLine);
                }

                if(accommodation != -1)
                {
                    SchedulePoiUnrestricted accommodationPoi = schedule.getAccommodationPoi();

                    int visitTimesStVal = route.getDayStart();
                    String visitTimesStart = visitTimesStVal / 60 + ":"
                            + ( (visitTimesStVal % 60) < 10 ? "0" + (visitTimesStVal % 60) : (visitTimesStVal % 60));

                    String[] splitTimesEn = maxOrderPoi.getVisitTimesEnd().split(":");
                    int visitTimesEnVal = Integer.parseInt(splitTimesEn[0]) * 60 + Integer.parseInt(splitTimesEn[1])
                            + timeCost[maxOrderPoi.getSolutionIndex()][accommodation];
                    String visitTimesEnd = visitTimesEnVal / 60 + ":" +
                            ( (visitTimesEnVal % 60) < 10 ? "0" + (visitTimesEnVal % 60) : (visitTimesEnVal % 60));

                    String[] splitTimesSt = minOrderPoi.getVisitTimesStart().split(":");
                    int waitingTime = (Integer.parseInt(splitTimesSt[0]) * 60 + Integer.parseInt(splitTimesSt[1]))
                            - (visitTimesStVal + timeCost[accommodation][minOrderPoi.getSolutionIndex()]);

                    String polyLine = mapboxUtils.fetchPolyLine(accommodationPoi.getCoordsString(),
                            schedule.getSchedulePois().get(minOrderPoi.getSolutionIndex()).getCoordsString());

                    route.getPois().add(new RoutePoi(accommodationPoi.getPoiId(), 0, visitTimesStart, visitTimesEnd,
                            timeCost[accommodation][minOrderPoi.getSolutionIndex()], waitingTime, polyLine));

                    route.setAccommodation(accommodationPoi.getPoiId());
                }
            }
        }

        return new DataUnrestricted(routes, model.toString());
    }
}
