package com.amihaeseisergiu.citytripplanner.utils;

import org.chocosolver.solver.Model;
import org.chocosolver.solver.Solver;
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

        solver.showShortStatistics();
        while(solver.solve()){
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
