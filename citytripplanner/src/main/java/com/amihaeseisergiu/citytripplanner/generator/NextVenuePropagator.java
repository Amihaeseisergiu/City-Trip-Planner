package com.amihaeseisergiu.citytripplanner.generator;

import org.chocosolver.solver.constraints.Propagator;
import org.chocosolver.solver.exception.ContradictionException;
import org.chocosolver.solver.variables.IntVar;
import org.chocosolver.util.ESat;

public class NextVenuePropagator extends Propagator<IntVar> {

    public NextVenuePropagator(int n, int i, int j,
                               IntVar[] ord, IntVar[] succCost, IntVar[] visitTimesEn,
                               int[] openingTimes, int[][] timeCost, int[] visitDurations)
    {
        super(ord);

        model.ifThen(
                ord[i].add(1).eq(ord[j]).and(ord[i].ne(n - 1)).decompose().reify(),
                succCost[i].eq(model.intVar(openingTimes[j]).sub(visitTimesEn[i].add(timeCost[i][j])).max(0)
                        .add(timeCost[i][j]).add(visitDurations[i])).decompose()
        );
    }

    @Override
    public void propagate(int i) throws ContradictionException {

    }

    @Override
    public ESat isEntailed() {
        return model.boolVar().getBooleanValue();
    }
}
