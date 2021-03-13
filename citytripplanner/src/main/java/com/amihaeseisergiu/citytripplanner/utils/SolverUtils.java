package com.amihaeseisergiu.citytripplanner.utils;

import org.chocosolver.solver.Model;
import org.chocosolver.solver.Solver;
import org.chocosolver.solver.search.strategy.Search;
import org.chocosolver.solver.search.strategy.selectors.values.IntDomainMin;
import org.chocosolver.solver.search.strategy.selectors.variables.MaxRegret;
import org.chocosolver.solver.variables.IntVar;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class SolverUtils {

    public void solve()
    {

        int n = 4;
        int max = 10;

        int dayStart = 360;
        int dayEnd = 1080;
        int[] openingTimes = new int[]{760, 800, 900, 760};
        int[] closingTimes = new int[]{820, 1080, 960, 1080};
        int[] visitDurations = new int[]{60, 60, 60, 60};

        int[][] timeCost = new int[][]{
                {0, 5, 3, 4},
                {5, 0, 10, 5},
                {3, 10, 0, 6},
                {4, 5, 6, 0},
        };

        Model model = new Model("City Planner");

        IntVar[] visitTimesSt = new IntVar[n];
        IntVar[] visitTimesEn = new IntVar[n];
        for(int i = 0; i < n; i++)
        {
            visitTimesSt[i] = model.intVar("visitTimesSt_" + i, Math.max(dayStart, openingTimes[i]), Math.min(dayEnd, closingTimes[i] - visitDurations[i]));
            visitTimesEn[i] = model.intVar("visitTimesEn_" + i, Math.max(dayStart, openingTimes[i]) + visitDurations[i], Math.min(dayEnd, closingTimes[i]));
        }

        IntVar[] succ = model.intVarArray("succ", n, 0, n - 1);
        IntVar[] pred = model.intVarArray("pred", n, 0, n - 1);
        IntVar[] succCost = model.intVarArray("succCost", n, 0, Arrays.stream(visitDurations).sum() + max * n);
        IntVar totalTimeCost = model.intVar("Total time cost", 0, Arrays.stream(visitDurations).sum() + max * n);

        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < n; j++)
            {
                if(j != i && j != 0)
                {
                    model.ifThen(
                            model.arithm(succ[i], "=", j),
                            model.arithm(succCost[i], "=", model.intVar(openingTimes[j]).sub(visitTimesEn[i].add(timeCost[i][j])).max(0)
                                    .add(timeCost[i][j]).add(visitDurations[i]).intVar())
                    );
                }
                else if(j != i)
                {
                    model.ifThen(
                            model.arithm(succ[i], "=", j),
                            model.arithm(succCost[i], "=", visitDurations[i])
                    );
                }
            }
        }

        model.inverseChanneling(pred, succ).post();

        for(int i = 0; i < n; i++)
        {
            model.arithm(visitTimesEn[i], "=", visitTimesSt[i], "+", visitDurations[i]).post();
            if(i > 0)
            {
                for(int j = 0; j < n; j++)
                {
                    model.ifThen(
                            model.arithm(pred[i], "=", j),
                            model.arithm(visitTimesSt[i], "=", visitTimesSt[j], "+", succCost[j])
                    );
                }
            }
        }

        model.sum(succCost, "=", totalTimeCost).post();
        model.subCircuit(succ, 0, model.intVar(n)).post();

        model.setObjective(Model.MINIMIZE, totalTimeCost);

        Solver solver = model.getSolver();
        solver.setSearch(
                Search.intVarSearch(
                        new MaxRegret(),
                        new IntDomainMin(),
                        succCost)
        );
        solver.showShortStatistics();
        while(solver.solve()){
            for (int i = 0; i < n; i++)
            {
                System.out.printf("succ[%d]=%d ", i, succ[i].getValue());
            }
            System.out.println();
            for (int i = 0; i < n; i++)
            {
                System.out.printf("pred[%d]=%d ", i, pred[i].getValue());
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
