package com.amihaeseisergiu.citytripplanner.utils;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
@EqualsAndHashCode
@Getter
@Setter
public class DurationsMatrix {

    private int[][] durationsMatrix;

    public int getMax()
    {
        int max = 0;

        for(int i = 0; i < durationsMatrix.length; i++)
        {
            for(int j = 0; j < durationsMatrix.length; j++)
            {
                if(durationsMatrix[i][j] > max)
                {
                    max = durationsMatrix[i][j];
                }
            }
        }

        return max;
    }
}
